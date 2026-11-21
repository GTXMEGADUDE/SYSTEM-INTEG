<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Organization;
use App\Models\User;
use App\Support\AppState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

// Signing in and out, and creating accounts. Buyers can shop right away; an organization's representative
// applies and can sign in once an administrator approves the organization. Every attempt goes in the activity log.
class AuthController extends Controller
{
    public function state(Request $request): JsonResponse
    {
        $user = Auth::user();
        // An account suspended or terminated since it signed in is signed out here, and the page is told why.
        if ($user && $user->status !== 'Active') {
            $blocked = strtolower($user->status);
            $this->signOut($request);

            return response()->json(['blocked' => $blocked] + AppState::for(null))->header('Cache-Control', 'no-store');
        }

        return response()->json(AppState::for($user))->header('Cache-Control', 'no-store');
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string'], ['email.*' => 'Enter your email address.', 'password.*' => 'Enter your password.']);
        $email = strtolower(trim($data['email']));
        $account = User::where('email', $email)->first();
        $refuse = function (string $type, string $detail, string $message) use ($account, $email) {
            Activity::record($type, $account ? $account->email : $email, $detail);

            return response()->json(['message' => $message], 422);
        };
        if (! $account) {
            return $refuse('signin-failed', 'No account with this email', 'The email or password is incorrect.');
        }
        if (! Hash::check($data['password'], $account->password)) {
            return $refuse('signin-failed', 'Wrong password', 'The email or password is incorrect.');
        }
        $blocked = [
            'Suspended' => ['signin-blocked', 'Account suspended', 'This account is suspended. Contact AniBayan support if you think this is a mistake.'],
            'Pending' => ['signin-waiting', 'Application under review', 'Your organization application is still being reviewed. You can sign in once an administrator approves it.'],
            'Declined' => ['signin-blocked', 'Application declined', 'Your organization application was declined, so this account can’t sign in.'],
            'Terminated' => ['signin-blocked', 'Organization terminated', 'Your organization was terminated after repeated warnings, so this account can’t sign in.'],
        ][$account->status] ?? null;
        if ($blocked) {
            return $refuse(...$blocked);
        }
        Auth::login($account);
        $request->session()->regenerate();
        $account->update(['last_active_on' => today()]);
        Activity::record('signin', $account->email);

        return response()->json(['role' => $account->role]);
    }

    public function register(Request $request): JsonResponse
    {
        $organization = $request->input('type') === 'organization';
        $rules = [
            'type' => 'required|in:buyer,organization', 'name' => 'required|string|min:3|max:80',
            'email' => 'required|email|max:120|unique:users,email', 'phone' => ['required', 'regex:/^(\+63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/'],
            'password' => 'required|string|min:8|max:200',
        ];
        if ($organization) {
            $rules += [
                'orgName' => 'required|string|min:3|max:80|unique:organizations,name', 'barangay' => ['required', Rule::in(config('anibayan.barangays'))],
                'crops' => 'required|string|min:3|max:80', 'members' => 'required|integer|min:1|max:100000',
                'documents' => 'required|array|min:1', 'documents.*' => 'in:CDA or SEC registration,Barangay endorsement,Representative ID',
            ];
        }
        $data = $request->validate($rules, [
            'email.unique' => 'An account already uses this email. Sign in instead.', 'phone.regex' => 'Enter a mobile number like 0917 555 0148.',
            'password.min' => 'Use at least 8 characters.', 'orgName.unique' => 'An organization with this name is already on AniBayan.',
            'barangay.*' => 'Choose your barangay.', 'documents.*' => 'Choose at least one document you can submit.',
        ]);
        $orgId = null;
        if ($organization) {
            $orgId = Organization::create([
                'name' => $data['orgName'], 'barangay' => $data['barangay'], 'crop' => $data['crops'], 'image' => 'field-detail.jpg',
                'status' => 'Pending review', 'representative' => $data['name'], 'members_declared' => $data['members'],
                'documents' => array_values($data['documents']), 'phone' => $data['phone'], 'applied_on' => today(),
            ])->id;
        }
        $account = User::create([
            'name' => $data['name'], 'email' => strtolower($data['email']), 'password' => $data['password'],
            'role' => $organization ? 'Representative' : 'Consumer', 'organization_id' => $orgId, 'status' => $organization ? 'Pending' : 'Active',
            'phone' => $data['phone'], 'joined_on' => today(), 'last_active_on' => today(),
        ]);
        Activity::record('register', $account->email, $organization ? 'Organization application · '.$data['orgName'] : 'Buyer');
        if (! $organization) {
            Auth::login($account);
            $request->session()->regenerate();
        }

        return response()->json(['role' => $account->role, 'organization' => $organization ? $data['orgName'] : null, 'email' => $account->email]);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($user = Auth::user()) {
            Activity::record('signout', $user->email);
        }
        $this->signOut($request);

        return response()->json(['signedOut' => true]);
    }

    private function signOut(Request $request): void
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}

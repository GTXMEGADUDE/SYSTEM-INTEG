<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Organization;
use App\Models\OrganizationDocument;
use App\Models\User;
use App\Support\AppState;
use App\Support\Documents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

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

    // Anything the server refuses here (an email or organization name already taken, a file that isn't really a PDF or
    // picture) gets the same generic answer, so the form can't be used to find out who has an account. The page checks
    // the format of each field itself before sending.
    public function register(Request $request): JsonResponse
    {
        $organization = $request->input('type') === 'organization';
        // Emails are kept in lower case, and names are compared ignoring capitals (Postgres compares them exactly).
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $rules = [
            'type' => 'required|in:buyer,organization', 'name' => 'required|string|min:3|max:80',
            'email' => 'required|email|max:120|unique:users,email', 'phone' => ['required', 'regex:'.ActionController::PHONE],
            'password' => 'required|string|min:8|max:200|confirmed',
        ];
        if ($organization) {
            $rules += [
                'orgName' => ['required', 'string', 'min:3', 'max:80', function (string $attribute, mixed $value, \Closure $fail) {
                    if (Organization::whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $value))])->exists()) {
                        $fail('An organization with this name is already on AniBayan.');
                    }
                }], 'barangay' => ['required', Rule::in(config('anibayan.barangays'))],
                'crops' => 'required|string|min:3|max:80',
                'documents' => 'required|array:'.implode(',', array_keys(Documents::TYPES)).'|min:1',
                'documents.*' => 'required|file|max:'.Documents::MAX_KB.'|mimetypes:'.implode(',', Documents::MIMES),
            ];
        }
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            Activity::record('register-refused', strtolower(trim((string) $request->input('email'))), implode(', ', array_keys($validator->errors()->messages())));

            return response()->json(['message' => $organization
                ? 'Your application couldn’t be submitted. Check your details and try again.'
                : 'Your account couldn’t be created. Check your details and try again.'], 422);
        }
        $data = $validator->validated();
        $stored = [];
        try {
            $account = DB::transaction(function () use ($data, $organization, $request, &$stored) {
                $org = null;
                if ($organization) {
                    $org = Organization::create([
                        'name' => $data['orgName'], 'barangay' => $data['barangay'], 'crop' => $data['crops'], 'image' => 'field-detail.jpg',
                        'status' => 'Pending review', 'representative' => $data['name'], 'phone' => $data['phone'], 'applied_on' => today(),
                    ]);
                    foreach (array_keys(Documents::TYPES) as $type) {
                        if ($file = $request->file('documents.'.$type)) {
                            $stored[] = Documents::store($org, $type, $file);
                        }
                    }
                }

                return User::create([
                    'name' => $data['name'], 'email' => strtolower($data['email']), 'password' => $data['password'],
                    'role' => $organization ? 'Representative' : 'Consumer', 'organization_id' => $org?->id, 'status' => $organization ? 'Pending' : 'Active',
                    'phone' => $data['phone'], 'joined_on' => today(), 'last_active_on' => today(),
                ]);
            });
        } catch (Throwable $e) {
            Storage::disk('local')->delete($stored);
            throw $e;
        }
        Activity::record('register', $account->email, $organization ? 'Organization application · '.$data['orgName'] : 'Buyer');
        if (! $organization) {
            Auth::login($account);
            $request->session()->regenerate();
        }

        return response()->json(['role' => $account->role, 'organization' => $organization ? $data['orgName'] : null, 'email' => $account->email]);
    }

    // An application's file, for administrators only; anyone else gets the same answer as for a file that doesn't exist.
    public function document(int $id): Response
    {
        $document = OrganizationDocument::find($id);
        if (! $document || ! Auth::user()?->isAdmin() || ! Storage::disk('local')->exists($document->path)) {
            self::refuse('That file isn’t available.', 404);
        }

        return Storage::disk('local')->response($document->path, $document->name, [
            'Content-Type' => $document->mime, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store',
        ]);
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

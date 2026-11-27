<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Organization;
use App\Models\OrganizationDocument;
use App\Models\User;
use App\Support\AppState;
use App\Support\BarangayDirectory;
use App\Support\Documents;
use App\Support\EmailNotifications;
use App\Support\MediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

// Signing in and out, and creating accounts. Buyers can shop right away; an organization's representative
// applies and can sign in once an administrator approves the organization. Every attempt goes in the activity log.
class AuthController extends Controller
{
    private const HOSTED_DEMO_LOGIN_EMAILS = ['alex@example.com', 'ramon@example.com', 'admin@example.com'];
    private const POLICIES_VERSION = '2026-11-27';

    public function state(Request $request): JsonResponse
    {
        $user = Auth::user();
        // An account suspended or terminated since it signed in is signed out here, and the page is told why.
        if ($user && $user->status !== 'Active') {
            $blocked = strtolower($user->status);
            $blockedReason = match ($user->status) {
                'Suspended' => $user->suspension_reason,
                'Declined' => $user->organization?->application_decline_reason,
                'Terminated' => $user->organization?->terminated_for,
                default => null,
            };
            $this->signOut($request);

            return response()->json(['blocked' => $blocked, 'blockedReason' => $blockedReason] + AppState::for(null))->header('Cache-Control', 'no-store');
        }

        return response()->json(AppState::for($user))->header('Cache-Control', 'no-store');
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email|max:160', 'password' => 'required|string|max:200'], ['email.*' => 'Enter your email address.', 'password.*' => 'Enter your password.']);
        $email = strtolower(trim($data['email']));
        $account = User::where('email', $email)->first();
        $refuse = function (string $type, string $detail, string $message) use ($account, $email) {
            Activity::record($type, $account ? $account->email : $email, $detail);

            return response()->json(['message' => $message], 422);
        };
        if (! $account) {
            return $refuse('signin-failed', 'No account with this email', 'The email or password is incorrect.');
        }
        if (! Hash::check($data['password'], $account->password)
            || ($this->isSharedStarterPassword($data['password']) && ! in_array($email, self::HOSTED_DEMO_LOGIN_EMAILS, true))) {
            return $refuse('signin-failed', 'Wrong password', 'The email or password is incorrect.');
        }
        if ($account->status === 'Suspended') {
            $reason = trim((string) $account->suspension_reason);
            $message = 'This account is suspended.'.($reason ? ' Reason: '.$reason : ' Contact AniBayan support if you think this is a mistake.');

            return $refuse('signin-blocked', 'Account suspended', $message);
        }
        $organization = $account->organization;
        $declineReason = trim((string) ($organization?->application_decline_reason ?? ''));
        $terminationReason = trim((string) ($organization?->terminated_for ?? ''));
        $blocked = [
            'Pending' => ['signin-waiting', 'Application under review', 'Your organization application is still being reviewed. You can sign in once an administrator approves it.'],
            'Declined' => ['signin-blocked', 'Application declined', 'Your organization application was declined, so this account can’t sign in.'.($declineReason ? ' Reason: '.$declineReason : '')],
            'Terminated' => ['signin-blocked', 'Organization terminated', 'Your organization was terminated, so this account can’t sign in.'.($terminationReason ? ' Reason: '.$terminationReason : ' Contact AniBayan support if you think this is a mistake.')],
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

    public function forgotPassword(Request $request): JsonResponse
    {
        if (! EmailNotifications::isConfigured()) {
            return response()->json(['message' => 'Password reset email is not available yet. Contact AniBayan support.'], 503);
        }

        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate(['email' => 'required|email|max:160'], ['email.*' => 'Enter your email address.']);

        if (EmailNotifications::isPlaceholderAddress($data['email'])) {
            return response()->json(['message' => 'If an account exists for that email, we sent a password reset link.']);
        }

        // Keep the response identical whether or not an account exists.
        try {
            $status = Password::sendResetLink($data);
        } catch (Throwable $exception) {
            try {
                if ($user = User::where('email', $data['email'])->first()) {
                    Password::broker()->deleteToken($user);
                }
            } catch (Throwable $cleanupException) {
                Log::warning('AniBayan password reset token cleanup failed.', ['error_type' => $cleanupException::class]);
            }
            Log::warning('AniBayan password reset email failed.', ['error_type' => $exception::class]);

            return response()->json(['message' => 'The reset email could not be sent right now. Try again later.'], 503);
        }

        if ($status === Password::RESET_THROTTLED) {
            return response()->json(['message' => 'Wait a little before requesting another reset link.'], 429);
        }

        return response()->json(['message' => 'If an account exists for that email, we sent a password reset link.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'email' => 'required|email|max:160', 'token' => 'required|string',
            'password' => ['required', 'string', 'min:8', 'max:200', 'confirmed', $this->rejectSharedStarterPassword()],
        ], [
            'email.*' => 'Enter your email address.', 'token.*' => 'This reset link is invalid or expired. Request a new one.',
            'password.min' => 'Use at least 8 characters.', 'password.confirmed' => 'The passwords do not match.',
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            event(new \Illuminate\Auth\Events\PasswordReset($user));
            EmailNotifications::send($user->email, 'AniBayan account security notice', 'Your password was reset',
                'The password for your AniBayan account was reset. If you did not make this change, contact AniBayan support.',
                ['Account' => $user->name], url('/anibayan/login.html'), 'Sign in');
        });

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Your password has been reset.']);
        }

        $message = match ($status) {
            Password::RESET_THROTTLED => 'Wait a little before trying another reset link.',
            default => 'This reset link is invalid or expired. Request a new one.',
        };

        return response()->json(['message' => $message], 422);
    }

    // Anything the server refuses here (an email or organization name already taken, a file that isn't really a PDF or
    // picture) gets the same generic answer, so the form can't be used to find out who has an account. The page checks
    // the format of each field itself before sending.
    public function register(Request $request): JsonResponse
    {
        $organization = $request->input('type') === 'organization';
        // Emails are kept in lower case, and names are compared ignoring capitals (Postgres compares them exactly).
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        if ($organization && is_string($request->input('barangay'))) {
            $request->merge(['barangay' => trim(preg_replace('/\s+/', ' ', $request->input('barangay')))]);
        }
        $rules = [
            'type' => 'required|in:buyer,organization', 'name' => 'required|string|min:3|max:80',
            'email' => 'required|email|max:120|unique:users,email', 'phone' => ['required', 'regex:'.ActionController::PHONE],
            'password' => ['required', 'string', 'min:8', 'max:200', 'confirmed', $this->rejectSharedStarterPassword()],
            'policies_accepted' => ['required', 'in:'.self::POLICIES_VERSION],
            'terms_version' => ['required', 'in:'.self::POLICIES_VERSION], 'privacy_notice_version' => ['required', 'in:'.self::POLICIES_VERSION],
        ];
        if ($organization) {
            $rules += [
                'sensitive_data_consent' => ['required', 'in:'.self::POLICIES_VERSION],
                'orgName' => ['required', 'string', 'min:3', 'max:80', function (string $attribute, mixed $value, \Closure $fail) {
                    if (Organization::whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $value))])->exists()) {
                        $fail('An organization with this name is already on AniBayan.');
                    }
                }], 'barangay' => 'required|string|min:2|max:80|not_in:__other__',
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
        if ($organization) {
            $data['barangay'] = trim(preg_replace('/\s+/', ' ', $data['barangay']));
            $knownBarangay = collect(BarangayDirectory::names())->first(fn ($name) => mb_strtolower($name) === mb_strtolower($data['barangay']));
            if ($knownBarangay) {
                $data['barangay'] = $knownBarangay;
            }
        }
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
                    'terms_version' => $data['terms_version'], 'privacy_notice_version' => $data['privacy_notice_version'], 'policies_accepted_at' => now(),
                    'sensitive_data_consent_version' => $organization ? $data['sensitive_data_consent'] : null,
                    'sensitive_data_consent_at' => $organization ? now() : null,
                ]);
            });
        } catch (Throwable $e) {
            MediaStorage::deletePrivate($stored);
            throw $e;
        }
        Activity::record('register', $account->email, $organization ? 'Organization application · '.$data['orgName'] : 'Buyer');
        EmailNotifications::send($account->email,
            $organization ? 'AniBayan organization application received' : 'Welcome to AniBayan',
            $organization ? 'Your organization application is in' : 'Welcome to AniBayan',
            $organization
                ? 'We received the application for '.$data['orgName'].'. An administrator will review it and email you when there is an update.'
                : 'Your account is ready. You can browse local harvests and place an order from AniBayan.',
            ['Account' => $account->name, 'Status' => $organization ? 'Application under review' : 'Active'],
            url($organization ? '/anibayan/login.html' : '/anibayan/consumer.html'),
            $organization ? 'View application status' : 'Shop the harvest');
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
        if (! $document || ! Auth::user()?->isAdmin()) {
            self::refuse('That file isn’t available.', 404);
        }

        return MediaStorage::privateResponse($document->path, $document->mime);
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

    private function isSharedStarterPassword(string $password): bool
    {
        $starter = (string) config('anibayan.demo_password', '');

        return config('app.env') === 'production' && $starter !== '' && hash_equals($starter, $password);
    }

    private function rejectSharedStarterPassword(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if (is_string($value) && $this->isSharedStarterPassword($value)) {
                $fail('This shared starter password is disabled. Choose another password or use password reset.');
            }
        };
    }
}

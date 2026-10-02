<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once '../../db.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database configuration error."]);
    exit();
}

try {
    require_once '../../auth/jwt.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Authentication configuration error."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->action) || !isset($data->email)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid request. Action and email are required."]);
    exit();
}

$action = trim($data->action);
$email = trim(strtolower($data->email));

if ($action === 'resend') {
    try {
        $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() === 0) {
            // Do not leak user existence, return success silently
            http_response_code(200);
            echo json_encode(["message" => "If the email is registered, a verification code has been sent."]);
            exit();
        }
        $user = $stmt->fetch();

        $otp = (string)random_int(100000, 999999);
        $expires = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $update = $conn->prepare("UPDATE users SET email_otp = ?, email_otp_expires = ? WHERE id = ?");
        $update->execute([$otp, $expires, $user['id']]);

        // Send email
        $to = $email;
        $subject = "VibeRide Email Verification Code";
        $message = "Hello " . htmlspecialchars($user['name']) . ",\n\n";
        $message .= "Your VibeRide verification code is:\n\n";
        $message .= $otp . "\n\n";
        $message .= "This code expires in 10 minutes.\n\n";
        $message .= "If you did not request this, please ignore this email.\n\n";
        $message .= "Regards,\nVibeRide Team";

        $from = getenv('SMTP_FROM') ?: 'noreply@viberide.in';
        $headers = "From: " . $from . "\r\n";
        $headers .= "Reply-To: " . $from . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        mail($to, $subject, $message, $headers);

        http_response_code(200);
        echo json_encode(["message" => "Verification code sent successfully."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Internal server error."]);
    }
} elseif ($action === 'verify') {
    if (!isset($data->otp)) {
        http_response_code(400);
        echo json_encode(["message" => "OTP is required."]);
        exit();
    }
    
    $otp = trim($data->otp);
    
    try {
        $stmt = $conn->prepare("SELECT id, name, role, email_otp, email_otp_expires, email_verified, verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "User not found."]);
            exit();
        }
        
        $user = $stmt->fetch();
        
        if ($user['email_verified'] && $user['verified'] && empty($user['email_otp'])) {
            http_response_code(409);
            echo json_encode(["message" => "Email is already verified."]);
            exit();
        }

        if (empty($user['email_otp'])) {
            http_response_code(422);
            echo json_encode(["message" => "No OTP requested or OTP has expired."]);
            exit();
        }

        if ($user['email_otp'] !== $otp) {
            http_response_code(422);
            echo json_encode(["message" => "Invalid verification code."]);
            exit();
        }

        if (strtotime($user['email_otp_expires']) < time()) {
            http_response_code(422);
            echo json_encode(["message" => "Verification code has expired."]);
            exit();
        }

        // Success
        $update = $conn->prepare("UPDATE users SET email_verified = 1, verified = 1, email_otp = NULL, email_otp_expires = NULL WHERE id = ?");
        $update->execute([$user['id']]);

        $payload = [
            "id" => (string)$user['id'],
            "role" => $user['role'],
            "email" => $email,
            "iat" => time(),
            "exp" => time() + (86400 * 30)
        ];
        
        $jwt = JWT::encode($payload);

        http_response_code(200);
        echo json_encode([
            "message" => "Email verified successfully.",
            "token" => $jwt,
            "user" => [
                "id" => (string)$user['id'],
                "name" => $user['name'],
                "email" => $email,
                "role" => $user['role'],
                "verified" => true,
                "email_verified" => true
            ]
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Internal server error."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid action."]);
}
?>

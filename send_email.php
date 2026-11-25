<?php
/*
 * Formulario de contacto — envío por correo desde el propio servidor.
 *
 * - No guarda los mensajes en el servidor: solo los reenvía por email.
 * - Solo recibe nombre, email, mensaje y la aceptación de la política de privacidad.
 * - Responde JSON si la petición viene por JavaScript; si no, redirige a la web.
 */

// ---------------- Configuración ----------------
const MAIL_TO   = 'joaquinmbaamonde@gmail.com';
// Remitente técnico del dominio (necesario para que el mail no caiga en spam).
// El email del visitante va en "Responder a".
const MAIL_FROM = 'web@joaquinbaamonde.com';
const MAX_NAME    = 100;
const MAX_MESSAGE = 5000;
// ------------------------------------------------

// Nunca mostrar errores de PHP al visitante (romperían la respuesta)
ini_set('display_errors', '0');

header('X-Content-Type-Options: nosniff');

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $error = '', int $status = 200): void
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    } else {
        header('Location: index.html?' . ($ok ? 'enviado=1' : 'error=' . urlencode($error)) . '#contact');
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'method', 405);
}

// Campo trampa: los humanos no lo ven; si viene relleno, es un bot.
// Se responde "ok" para no darle pistas, pero no se envía nada.
if (!empty($_POST['website'])) {
    respond(true);
}

// Longitud en caracteres (sin depender de la extensión mbstring)
function text_length(string $s): int
{
    return function_exists("mb_strlen") ? mb_strlen($s, "UTF-8") : (int)preg_match_all("/./us", $s);
}

// Codifica una cabecera con acentos (RFC 2047)
function encode_header(string $s): string
{
    return "=?UTF-8?B?" . base64_encode($s) . "?=";
}

// Quita saltos de línea y caracteres de control (evita inyección de cabeceras)
function clean_line(string $s): string
{
    // Sin /u: esos bytes nunca forman parte de un carácter UTF-8 multibyte,
    // y así no falla aunque llegue texto mal codificado.
    return trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', $s));
}

$nombre  = clean_line((string)($_POST['nombre'] ?? ''));
$email   = clean_line((string)($_POST['email'] ?? ''));
$mensaje = trim(str_replace("\0", '', (string)($_POST['message'] ?? '')));
$acepta  = !empty($_POST['acepta_privacidad']);

if ($nombre === '' || $email === '' || $mensaje === '') {
    respond(false, 'required', 422);
}
if (!$acepta) {
    respond(false, 'privacy', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || text_length($email) > 254) {
    respond(false, 'email', 422);
}
if (text_length($nombre) > MAX_NAME || text_length($mensaje) > MAX_MESSAGE) {
    respond(false, 'length', 422);
}

$fecha = (new DateTime('now', new DateTimeZone('Europe/Madrid')))->format('d/m/Y H:i');

$subject = encode_header('Nuevo mensaje desde la web — ' . $nombre);

$body = "Nuevo mensaje desde el formulario de contacto de la web.\n\n"
      . "Nombre: {$nombre}\n"
      . "Email: {$email}\n"
      . "Fecha: {$fecha} (hora de Madrid)\n"
      . "Política de privacidad: aceptada\n\n"
      . "Mensaje:\n"
      . str_repeat('-', 40) . "\n"
      . $mensaje . "\n"
      . str_repeat('-', 40) . "\n\n"
      . "Para responder, usa «Responder»: el mensaje irá directamente a {$email}.\n";

$fromName = encode_header('Web Joaquín M. Baamonde');
$headers = [
    'From: ' . $fromName . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP',
];

$sent = mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

respond($sent, $sent ? '' : 'send', $sent ? 200 : 500);

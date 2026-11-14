<?php
/**
 * HK Business Consultancy — site theme.
 *
 * Serves the static website in /site as the front end of this WordPress install:
 *   /                -> site/index.html
 *   /about.html      -> site/about.html   (also /about)
 *   /assets/...      -> site/assets/...   (fallback; pages link assets straight from the theme folder)
 * Unknown addresses get site/404.html with a 404 status.
 * WordPress admin, login and the REST API are untouched.
 *
 * Contact form: POSTs to /contact.html are emailed with wp_mail() to the address
 * below and also saved under Tools → HK Enquiries, so nothing is lost if email fails.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HKBC_SITE_DIR', __DIR__ . '/site' );
define( 'HKBC_ENQUIRY_TO', '%%EMAIL%%' );
define( 'HKBC_ENQUIRY_OPTION', 'hkbc_enquiries' );

function hkbc_mime( $file ) {
	$types = array(
		'html'  => 'text/html; charset=utf-8',
		'css'   => 'text/css; charset=utf-8',
		'js'    => 'application/javascript; charset=utf-8',
		'json'  => 'application/json',
		'svg'   => 'image/svg+xml',
		'png'   => 'image/png',
		'jpg'   => 'image/jpeg',
		'jpeg'  => 'image/jpeg',
		'webp'  => 'image/webp',
		'avif'  => 'image/avif',
		'ico'   => 'image/x-icon',
		'woff2' => 'font/woff2',
		'mp4'   => 'video/mp4',
		'webm'  => 'video/webm',
		'xml'   => 'application/xml; charset=utf-8',
		'txt'   => 'text/plain; charset=utf-8',
	);
	$ext = strtolower( pathinfo( $file, PATHINFO_EXTENSION ) );
	return isset( $types[ $ext ] ) ? $types[ $ext ] : 'application/octet-stream';
}

/** Request path relative to the WordPress home URL, e.g. "about.html". */
function hkbc_request_path() {
	$path = (string) parse_url( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH );
	$home = (string) parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( '' === $home ) {
		$home = '/';
	}
	if ( 0 === strpos( $path, $home ) ) {
		$path = substr( $path, strlen( $home ) );
	}
	return rawurldecode( ltrim( $path, '/' ) );
}

/** Map a request path to a file inside /site, or null. Never escapes /site. */
function hkbc_resolve( $rel ) {
	if ( '' === $rel || '/' === substr( $rel, -1 ) ) {
		$rel .= 'index.html';
	}
	if ( ! preg_match( '/\.[a-z0-9]+$/i', $rel ) ) {
		$rel .= '.html';
	}
	$root = realpath( HKBC_SITE_DIR );
	$full = realpath( HKBC_SITE_DIR . '/' . $rel );
	if ( ! $root || ! $full || 0 !== strpos( $full, $root . DIRECTORY_SEPARATOR ) || ! is_file( $full ) ) {
		return null;
	}
	return $full;
}

/** Point a page's asset links straight at the theme folder, so the web server serves them directly. */
function hkbc_page_html( $file ) {
	$base = trailingslashit( get_template_directory_uri() ) . 'site/assets/';
	$html = file_get_contents( $file );
	return preg_replace_callback(
		'#(["\'(\s,])assets/#',
		function ( $m ) use ( $base ) {
			return $m[1] . $base;
		},
		$html
	);
}

function hkbc_serve() {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	$rel = hkbc_request_path();

	if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] && in_array( $rel, array( 'contact.html', 'contact' ), true ) ) {
		hkbc_handle_enquiry();
	}

	$file   = hkbc_resolve( $rel );
	$status = 200;
	if ( ! $file ) {
		$file   = HKBC_SITE_DIR . '/404.html';
		$status = 404;
	}
	status_header( $status );
	header( 'Content-Type: ' . hkbc_mime( $file ) );
	header( 'X-Content-Type-Options: nosniff' );
	if ( '.html' === substr( $file, -5 ) ) {
		header( 'Cache-Control: no-cache' );
		echo hkbc_page_html( $file ); // phpcs:ignore WordPress.Security.EscapeOutput -- trusted theme file
	} else {
		header( 'Cache-Control: public, max-age=604800' );
		header( 'Content-Length: ' . filesize( $file ) );
		readfile( $file );
	}
	exit;
}
add_action( 'template_redirect', 'hkbc_serve', 0 );

/* ---------------- contact form ---------------- */

function hkbc_respond( $status, $ok ) {
	status_header( $status );
	header( 'Content-Type: application/json; charset=utf-8' );
	echo wp_json_encode( array( 'ok' => $ok ) );
	exit;
}

function hkbc_handle_enquiry() {
	// Honeypot: bots fill the hidden field. Pretend success.
	if ( ! empty( $_POST['bot-field'] ) ) {
		hkbc_respond( 200, true );
	}

	// At most 5 enquiries per visitor per hour.
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
	$key = 'hkbc_rl_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 5 ) {
		hkbc_respond( 429, false );
	}
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$field = function ( $k ) {
		return isset( $_POST[ $k ] ) ? sanitize_text_field( wp_unslash( $_POST[ $k ] ) ) : '';
	};
	$e = array(
		'name'    => $field( 'name' ),
		'company' => $field( 'company' ),
		'email'   => isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '',
		'phone'   => $field( 'phone' ),
		'country' => $field( 'country' ),
		'enquiry' => $field( 'enquiry' ),
		'sector'  => $field( 'sector' ),
		'message' => isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '',
		'date'    => current_time( 'mysql' ),
	);
	if ( strlen( $e['name'] ) < 2 || ! is_email( $e['email'] ) || strlen( $e['message'] ) < 10 ) {
		hkbc_respond( 400, false );
	}

	// Keep a copy first, so an email failure never loses an enquiry.
	$all = get_option( HKBC_ENQUIRY_OPTION, array() );
	if ( ! is_array( $all ) ) {
		$all = array();
	}
	array_unshift( $all, $e );
	update_option( HKBC_ENQUIRY_OPTION, array_slice( $all, 0, 500 ), false );

	$body  = "New enquiry from the website\n\n";
	$body .= "Name: {$e['name']}\nCompany: {$e['company']}\nEmail: {$e['email']}\nTelephone: {$e['phone']}\n";
	$body .= "Country: {$e['country']}\nNature of enquiry: {$e['enquiry']}" . ( $e['sector'] ? " ({$e['sector']})" : '' ) . "\n\n";
	$body .= "Message:\n{$e['message']}\n";
	$subject = 'Website enquiry — ' . ( $e['enquiry'] ? $e['enquiry'] : 'General' ) . ' — ' . $e['name'];
	$headers = array( 'Reply-To: ' . $e['name'] . ' <' . $e['email'] . '>' );
	wp_mail( apply_filters( 'hkbc_enquiry_to', HKBC_ENQUIRY_TO ), $subject, $body, $headers );

	hkbc_respond( 200, true );
}

/* ---------------- Tools → HK Enquiries ---------------- */

add_action(
	'admin_menu',
	function () {
		add_management_page( 'HK Enquiries', 'HK Enquiries', 'manage_options', 'hk-enquiries', 'hkbc_enquiries_page' );
	}
);

function hkbc_enquiries_page() {
	$all = get_option( HKBC_ENQUIRY_OPTION, array() );
	echo '<div class="wrap"><h1>HK Enquiries</h1>';
	echo '<p>Enquiries sent through the website contact form (newest first). Each one is also emailed to ' . esc_html( HKBC_ENQUIRY_TO ) . '.</p>';
	if ( empty( $all ) ) {
		echo '<p><em>No enquiries yet.</em></p></div>';
		return;
	}
	echo '<table class="widefat striped"><thead><tr><th>Date</th><th>Name</th><th>Company</th><th>Email</th><th>Telephone</th><th>Country</th><th>Enquiry</th><th>Message</th></tr></thead><tbody>';
	foreach ( $all as $e ) {
		printf(
			'<tr><td>%s</td><td>%s</td><td>%s</td><td><a href="mailto:%4$s">%4$s</a></td><td>%5$s</td><td>%6$s</td><td>%7$s</td><td>%8$s</td></tr>',
			esc_html( $e['date'] ),
			esc_html( $e['name'] ),
			esc_html( $e['company'] ),
			esc_attr( $e['email'] ),
			esc_html( $e['phone'] ),
			esc_html( $e['country'] ),
			esc_html( $e['enquiry'] . ( $e['sector'] ? ' (' . $e['sector'] . ')' : '' ) ),
			nl2br( esc_html( $e['message'] ) )
		);
	}
	echo '</tbody></table></div>';
}

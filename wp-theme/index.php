<?php
/**
 * Required by WordPress. The site is served from functions.php (hkbc_serve);
 * this file only runs if that was skipped, and then shows the home page.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
echo hkbc_page_html( HKBC_SITE_DIR . '/index.html' ); // phpcs:ignore WordPress.Security.EscapeOutput

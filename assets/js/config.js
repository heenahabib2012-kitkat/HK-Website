/* ==========================================================================
   HK — Site configuration (EDIT ME)
   --------------------------------------------------------------------------
   photos: drop an optimised WebP/AVIF file into assets/img/ and set the path.
           Leave it empty to keep the "Portrait to follow" placeholder.
   formEndpoint: URL that accepts a POST of the enquiry form (FormData),
           e.g. a Formspree / Basin / your own endpoint. While empty the form
           validates and shows the confirmation message but sends nothing.
   ========================================================================== */
window.HK = window.HK || {};
window.HK.config = {
  formEndpoint: '',

  photos: {
    chairman: ''    // Chairman portrait, ~900x1100 WebP/AVIF, e.g. 'assets/img/chairman.webp'
  }
};

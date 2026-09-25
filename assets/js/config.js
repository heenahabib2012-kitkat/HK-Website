/* ==========================================================================
   HK — Site configuration (EDIT ME)
   --------------------------------------------------------------------------
   photos: drop optimised WebP/AVIF files into assets/img/ and set the path.
           Leave a value empty to keep the built-in illustrated artwork.
           Photos load lazily and fade in over the illustration.
   formEndpoint: URL that accepts a POST of the enquiry form (FormData),
           e.g. a Formspree / Basin / your own endpoint. While empty the form
           validates and shows the confirmation message but sends nothing.
   ========================================================================== */
window.HK = window.HK || {};
window.HK.config = {
  formEndpoint: '',

  photos: {
    hero: '',       // Downtown Dubai / Burj Khalifa at night, ~2400px wide
    about: '',      // Dubai business district, portrait crop ~1200x1500
    whyDubai: '',   // Panoramic Dubai skyline
    kuwait: '',     // Kuwait skyline (Journey section)
    chairman: '',   // Chairman portrait, ~900x1100
    cta: '',        // Dubai skyline at night
    insight1: '', insight2: '', insight3: '', insight4: '', insight5: '', insight6: ''
  }
};

crypto.subtle
  .generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
  .then((key) => crypto.subtle.exportKey("jwk", key))
  .then(JSON.stringify)
  .then(console.log)

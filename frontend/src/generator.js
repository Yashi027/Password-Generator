export function generatePassword(length = 8, numallow = false, challow = false) {
  let pass = "";
  let str = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm";

  if (numallow) str += "1234567890";
  if (challow) str += "_@!#$%^&*?/:|+-";

  for (let i = 0; i < length; i++) {
    const charid = Math.floor(Math.random() * str.length);
    pass += str.charAt(charid);
  }
  return pass;
}

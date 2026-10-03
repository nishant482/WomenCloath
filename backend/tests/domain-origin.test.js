import { test } from "node:test";
import assert from "node:assert/strict";
import { config } from "../src/config/env.js";
import { checkOrigin } from "../src/middleware/request-security.js";

test("production accepts only configured domain origins and keeps CSRF header checks", () => {
  const previous = { ...config };
  Object.assign(config, { production: true, appUrl: "https://store.example", allowedOrigins: ["https://rajothreads.com", "https://www.rajothreads.com"] });
  const check = (origin, header = "RajoStore") => {
    let error;
    checkOrigin({ method: "POST", headers: { origin, "x-requested-with": header } }, {}, e => { error = e; });
    return error;
  };
  try {
    for (const origin of ["https://store.example", "https://rajothreads.com", "https://www.rajothreads.com"]) assert.equal(check(origin), undefined);
    for (const origin of [undefined, "https://rajothreads.com.attacker.test", "http://rajothreads.com", "https://attacker.test"]) assert.equal(check(origin)?.status, 403);
    assert.equal(check("https://rajothreads.com", "")?.status, 403);
  } finally { Object.assign(config, previous); }
});

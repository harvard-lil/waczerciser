import { test } from "node:test";
import assert from "node:assert/strict";
import { hasFiles, uriToFilePath, safeJoin } from "../../src/lib/utils.ts";
import fs from "fs";
import path from "path";
import { withTempDir } from "../helpers.ts";

test("utils.hasFiles", async (t) => {
	await t.test(
		"returns true for directory with files",
		withTempDir(async (tempDir) => {
			await fs.promises.writeFile(path.join(tempDir, "test.txt"), "test");
			assert.equal(await hasFiles(tempDir), true);
		}),
	);

	await t.test(
		"returns false for empty directory",
		withTempDir(async (tempDir) => {
			assert.equal(await hasFiles(tempDir), false);
		}),
	);
});

test("utils.uriToFilePath", async (t) => {
	const cases = [
		{
			uri: "https://example.com/path/page.html",
			expected: "https:/example.com/path/page.html",
		},
		{
			uri: "https://example.com/path/",
			expected: "https:/example.com/path/__index__.html",
		},
		{
			uri: "https://example.com/path",
			expected: "https:/example.com/path/__index__.html",
		},
		{ uri: "file:///path/page.html", expected: "file:/path/page.html" },
	];

	for (const { uri, expected } of cases) {
		await t.test(`converts ${uri} to ${expected}`, () => {
			const result = uriToFilePath({"warcTargetURI": uri});
			assert.equal(result, expected);
		});
	}
});

test("utils.safeJoin", async (t) => {
	const cases = [
		{
			base: "/safe/path",
			unsafe: "../../../etc/passwd",
			expected: "/safe/path/etc/passwd",
		},
		{
			base: "/safe/path",
			unsafe: "etc/../../../passwd/",
			expected: "/safe/path/passwd/",
		},
		{ base: "", unsafe: "/etc/passwd", expected: "etc/passwd" },
	];

	for (const { base, unsafe, expected } of cases) {
		await t.test(`prevents directory traversal for ${unsafe}`, () => {
			const result = safeJoin(base, unsafe);
			assert.equal(result, expected);
		});
	}
});

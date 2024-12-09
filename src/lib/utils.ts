import fs from "fs";
import path from "path";
import mime from "mime-types";
import { createHash } from "crypto";
import type { WARCRecord } from "warcio";

/**
 * Determine whether the given `path` points to a directory with files.
 *
 * @returns {Boolean}
 */
export async function hasFiles(path: string) {
	const directory = await fs.promises.opendir(path);
	const entry = await directory.read();
	await directory.close();
	return entry !== null;
}

/**
 * Determine whether the given `path` exists.
 *
 * @returns {Boolean}
 */
export async function pathExists(path: string) {
	return await fs.promises
		.access(path)
		.then(() => true)
		.catch(() => false);
}

/**
 * Convert a URI to a file path, include protocol: as the first directory, and adding __index__.html if it's a directory
 * @param uri - URI to convert
 * @returns File path
 */
export function uriToFilePath(record: WARCRecord) {
    let uri = record.warcTargetURI;
    if (!uri) {
		throw new Error("WARC-Target-URI header is required");
	}

	// replace multiple slashes with a single slash
	uri = uri.replace(/\/+/g, "/");

	// if no extension, use `__index__` as filename and content type to determine the extension
	if (uri.endsWith("/") || !uri.split("/")[uri.split("/").length - 1].includes(".")) {
		uri = uri.replace(/\/$/, "")
		const contentType = record.httpHeaders?.headers.get("Content-Type") || "text/html";
		const extension = mime.extension(contentType);
		uri += `/__index__.${extension}`;
	} else {
		// constrain the length of the filename to 255 characters
		const uriParts = uri.split("/");
		const filename = uriParts[uriParts.length - 1];
		if (filename.length > 255) {
			const prefix = filename.slice(0, 190)
			const suffix = filename.slice(190)
			const hash = createHash('sha256').update(suffix).digest('hex');
			uri = uriParts.slice(0, -1).concat([`${prefix}_${hash}`]).join("/");
		}
	}
    
	return uri;
}

/**
 * Join paths safely, protecting against directory traversal outside of the base path
 * @param base - Base path
 * @param paths - Paths to join
 * @returns Joined path
 */
export function safeJoin(base: string, ...paths: string[]): string {
	return path.join(base || ".", path.join("/", ...paths));
}

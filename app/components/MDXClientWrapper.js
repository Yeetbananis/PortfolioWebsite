// app/components/MDXClientWrapper.js
"use client";

import ImageWithFullscreen from "./ImageWithFullscreen";
import { MDXRemote } from "next-mdx-remote/rsc";

export default function MDXClientWrapper({ source }) {
  return <MDXRemote source={source} components={{ ImageWithFullscreen }} />;
}

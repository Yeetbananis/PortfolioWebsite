// app/components/MDXClientWrapper.js
// 1. DO NOT use 'use client' here. This must remain a Server Component.

import ImageWithFullscreen from "./ImageWithFullscreen";
import PCAMathAnimator from "./PCAMathAnimator"; 
import { MDXRemote } from "next-mdx-remote/rsc";


export default function MDXClientWrapper({ source }) {
  return (
    <MDXRemote 
      source={source} 
      components={{ 
        ImageWithFullscreen, 
        PCAMathAnimator 
      }} 
    />
  );
}
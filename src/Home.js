import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const Wrapper = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;

  .iframe-wrapper {
    overflow: hidden;
    padding-bottom: 75%;
    position: relative;
    height: 0;
    border: 1px solid #000;
    iframe {
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
      position: absolute;
    }
  }
`;

export default function Home() {
  return (
    <Wrapper>
      <h1>Welcome to CS766 Final Project: Virtual Try-on</h1>

      <h2>Below is a more detailed written report for the project.</h2>
      <h2>
        Otherwise, <Link to="/video">watch the video</Link>.
      </h2>
      <h2>
        Or play with the <Link to="/demo">DEMO</Link>.
      </h2>
      <h2>
        Source code on{" "}
        <a
          href="https://github.com/paul841029/BadgerFIT"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </h2>
      <div className="iframe-wrapper">
        <iframe
          width="560"
          height="315"
          title="written report for final project"
          src="/website.html"
          frameBorder="0"
        />
      </div>
    </Wrapper>
  );
}

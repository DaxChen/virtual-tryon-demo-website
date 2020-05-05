import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Button, AppBar, Toolbar } from "@material-ui/core";
import styled from "styled-components";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";

import BackgroundRemove from "./BackgroundRemove";
import Pipeline from "./Pipeline";
import Home from "./Home";

const Wrapper = styled.div`
  .appbar-title {
    margin-right: auto;
    a {
      text-decoration: none;
      color: inherit;
    }
  }
  .appbar-link {
    margin: 0 0.5rem;
  }

  .video-page {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  /* responsive youtube */
  .video-responsive {
    overflow: hidden;
    padding-bottom: 56.25%;
    position: relative;
    height: 0;
  }

  .video-responsive iframe {
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    position: absolute;
  }
`;

export default function App() {
  return (
    <Router>
      <Wrapper>
        <ReactNotification />
        <AppBar position="sticky">
          <Toolbar>
            <h1 className="appbar-title">
              <Link to="/">Virtual Try-on</Link>
            </h1>

            <Button
              className="appbar-link"
              component={Link}
              to="/demo"
              variant="contained"
            >
              Demo
            </Button>
            <Button
              className="appbar-link"
              component={Link}
              to="/video"
              variant="contained"
            >
              Video
            </Button>
            <Button
              className="appbar-link"
              component={Link}
              to="/background-remove"
              variant="contained"
            >
              OpenCV.js Background Remove
            </Button>
          </Toolbar>
        </AppBar>

        {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          <Route path="/demo" exact>
            <Pipeline />
          </Route>

          <Route path="/video" exact>
            <div className="video-page">
              <h2>Presentation Video</h2>
              <div className="video-responsive">
                <iframe
                  title="presentation video"
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/Y0M50lZ6roY"
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </Route>

          <Route path="/background-remove" exact>
            <BackgroundRemove />
          </Route>
        </Switch>
      </Wrapper>
    </Router>
  );
}

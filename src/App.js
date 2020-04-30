import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Button, AppBar, Toolbar } from "@material-ui/core";
import styled from "styled-components";

import BackgroundRemove from "./BackgroundRemove";
import Openpose from "./Openpose";

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
`;

export default function App() {
  return (
    <Router>
      <Wrapper>
        <AppBar position="sticky">
          <Toolbar>
            <h1 className="appbar-title">
              <Link to="/">CS766 Virtual Try-on</Link>
            </h1>

            <Button
              className="appbar-link"
              component={Link}
              to="/background-remove"
              variant="contained"
              color="secondary"
            >
              OpenCV.js Background Remove
            </Button>
            <Button
              className="appbar-link"
              component={Link}
              to="/openpose"
              variant="contained"
              color="secondary"
            >
              Openpose
            </Button>
          </Toolbar>
        </AppBar>

        {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/" exact></Route>

          <Route path="/background-remove" exact>
            <BackgroundRemove />
          </Route>

          <Route path="/openpose" exact>
            <Openpose />
          </Route>
        </Switch>
      </Wrapper>
    </Router>
  );
}

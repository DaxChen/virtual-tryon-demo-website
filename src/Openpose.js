import React from "react";
import styled from "styled-components";
import axios from "axios";
import { Button } from "@material-ui/core";
import ReactJson from "react-json-view";

import Loading from "./Loading";

const Wrapper = styled.div`
  padding: 1rem;
  .bla {
  }
`;

export default class Openpose extends React.Component {
  state = {
    loading: false,
    response: null,
    previewUrl: null,
    file: null,
  };

  callOpenpose = (file) => {
    if (this.state.loading) return;

    this.setState({ loading: true });

    const formData = new FormData();
    formData.append("file", file);

    axios
      .post("https://openpose-s3mg3fuleq-uc.a.run.app", formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      })
      .then((response) => {
        this.setState({
          loading: false,
          response: {
            rendered: `data:image/png;base64,${response.data.rendered}`,
            keypoints: JSON.parse(response.data.keypoints),
          },
        });
      })
      .catch((error) => {
        this.setState({ loading: false });
        console.log(error);
      });
  };

  onInputChange = (e) => {
    this.setState({
      file: e.target.files[0],
      previewUrl: URL.createObjectURL(e.target.files[0]),
    });

    this.callOpenpose(e.target.files[0]);
  };

  render() {
    const { previewUrl, response } = this.state;
    return (
      <Wrapper>
        <Loading loading={this.state.loading} />
        <input
          accept="image/*"
          style={{ display: "none" }}
          id="contained-button-file"
          type="file"
          onChange={this.onInputChange}
        />
        <label htmlFor="contained-button-file">
          <Button variant="contained" color="primary" component="span">
            Upload Image
          </Button>
        </label>

        {previewUrl && (
          <div>
            <h3>original image:</h3>
            <img src={previewUrl} alt="" />
          </div>
        )}
        {response && (
          <div>
            <h3>rendered:</h3>
            <img src={response.rendered} alt="" />
            <h3>keypoints:</h3>
            <ReactJson src={response.keypoints} />
          </div>
        )}
      </Wrapper>
    );
  }
}

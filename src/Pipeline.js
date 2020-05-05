/* globals cv */
import React from "react";
import styled from "styled-components";
import axios from "axios";
import { Button, Paper } from "@material-ui/core";
import ReactJson from "react-json-view";
import Jimp from "jimp/es";

import { dataURL2file, loadOneImg } from "./image-processing";
import Loading from "./Loading";

const Wrapper = styled.div`
  padding: 1rem;

  .MuiPaper-root {
    padding: 1rem;
  }

  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  > .MuiPaper-root {
    flex: 1 1 0px;
    min-width: 300px;
    max-width: 600px;
    margin: 1rem;
  }

  .block {
    position: relative;
    min-height: 300px;
    .loading {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      transition: background 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

export default class Pipeline extends React.Component {
  state = {
    modelUrl: null,
    modelFile: null,
    clothUrl: null,
    clothFile: null,
    clothCV: null,
    clothMaskFile: null,
    openpose: null,
    openposeLoading: false,
    jppnet: null,
    jppnetLoading: false,
    cpvton: null,
    cpvtonLoading: false,
  };

  callOpenposeAndJppnet = (file) => {
    this.setState({
      openposeLoading: true,
      jppnetLoading: true,
    });

    const formData = new FormData();
    formData.append("file", file);

    axios
      .post("/api/openpose", formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      })
      .then((response) => {
        this.setState({
          openposeLoading: false,
          openpose: {
            rendered: `data:image/png;base64,${response.data.rendered}`,
            keypoints: JSON.parse(response.data.keypoints),
          },
        });
      })
      .catch((error) => {
        this.setState({ openposeLoading: false });
        // TODO: show error message
        console.log(error);
      });

    axios
      .post("/api/lip_jppnet", formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      })
      .then((response) => {
        this.setState({
          jppnetLoading: false,
          jppnet: {
            output: `data:image/png;base64,${response.data.output}`,
            vis: `data:image/png;base64,${response.data.vis}`,
          },
        });
      })
      .catch((error) => {
        this.setState({ jppnetLoading: false });
        // TODO: show error message
        console.log(error);
      });
  };

  callCpvton = () => {
    const {
      modelFile,
      clothFile,
      clothMaskFile,
      openpose,
      jppnet,
      cpvtonLoading,
    } = this.state;

    if (cpvtonLoading) return;

    this.setState({ cpvtonLoading: true, cpvton: null });

    // generate pose.json
    const poseFile = new Blob([JSON.stringify(openpose.keypoints)], {
      type: "text/plain;charset=utf-8",
    });

    const formData = new FormData();
    formData.append("model", modelFile);
    formData.append("model-parse", dataURL2file(jppnet.output));
    formData.append("cloth", clothFile);
    formData.append("cloth-mask", clothMaskFile);
    formData.append("pose", poseFile);
    axios
      .post("/api/cpvton", formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      })
      .then((response) => {
        this.setState({
          cpvtonLoading: false,
          cpvton: {
            warpCloth: `data:image/jpeg;base64,${response.data["warp-cloth"]}`,
            warpMask: `data:image/jpeg;base64,${response.data["warp-mask"]}`,
            tryon: `data:image/jpeg;base64,${response.data.tryon}`,
          },
        });
      })
      .catch((error) => {
        this.setState({ cpvtonLoading: false });
        // TODO: show error message
        console.log(error);
      });
  };

  generateMask = (clothCV) => {
    const channels = new cv.MatVector();
    const r = new cv.Mat();
    channels.push_back(r);
    const g = new cv.Mat();
    channels.push_back(g);
    const b = new cv.Mat();
    channels.push_back(b);
    const a = new cv.Mat();
    channels.push_back(a);

    cv.split(clothCV, channels);

    const mask = new cv.Mat();
    // only apply on the alpha channel
    const alpha = channels.get(3);
    cv.threshold(alpha, mask, 254, 255, cv.THRESH_BINARY);
    cv.imshow("clothMask", mask);

    // get mask from canvas...
    const canvas = document.querySelector("#clothMask");
    const clothMaskUrl = canvas.toDataURL("image/jpeg");
    const clothMaskFile = dataURL2file(clothMaskUrl, "mask.jpg");
    this.setState({ clothMaskFile });

    // cleanup
    r.delete();
    g.delete();
    b.delete();
    a.delete();
    channels.delete();
    alpha.delete();
    mask.delete();
  };

  onUploadModel = async (e) => {
    if (e.target.files.length < 1) return;

    // resize
    const img = await Jimp.read(URL.createObjectURL(e.target.files[0]));
    img.contain(192, 256);
    img.background(0xffffffff);
    // console.log(img);

    const modelUrl = await img.getBase64Async(Jimp.MIME_JPEG);
    const modelFile = dataURL2file(modelUrl);

    this.setState({
      modelFile,
      modelUrl,
      openpose: null,
      jppnet: null,
    });

    this.callOpenposeAndJppnet(modelFile);
  };

  onUploadClothes = async (e) => {
    if (e.target.files.length < 1) return;

    // resize
    const img = await Jimp.read(URL.createObjectURL(e.target.files[0]));
    img.contain(192, 256);

    // use png to have transparent for mask generation
    const clothCV = cv.imread(
      await loadOneImg(await img.getBase64Async(Jimp.MIME_PNG))
    );

    // set background to white
    img.background(0xffffffff);
    // console.log(img);

    const clothUrl = await img.getBase64Async(Jimp.MIME_JPEG);
    const clothFile = dataURL2file(clothUrl);

    if (this.state.clothCV) this.state.clothCV.delete();

    this.setState({ clothFile, clothUrl, clothCV });

    this.generateMask(clothCV);
  };

  render() {
    const {
      modelUrl,
      clothUrl,
      // clothFile,
      clothMaskFile,
      openpose,
      openposeLoading,
      jppnet,
      jppnetLoading,
      cpvton,
      cpvtonLoading,
    } = this.state;

    return (
      <Wrapper>
        <Paper elevation={3}>
          <h2>Model Pre-Processing</h2>
          {/* model input */}
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="modelInput"
            type="file"
            onChange={this.onUploadModel}
          />
          <label htmlFor="modelInput">
            <Button variant="contained" color="primary" component="span">
              Upload Image of Model
            </Button>
          </label>

          <div className="block">
            <h3>Resized Image (256x192)</h3>
            {modelUrl && (
              <div>
                <img src={modelUrl} alt="" />
              </div>
            )}
          </div>
          <div className="block">
            <h3>Openpose</h3>
            <Loading loading={openposeLoading} backdrop={false} />
            {openpose && (
              <div>
                <h3>rendered:</h3>
                <img src={openpose.rendered} alt="" />
              </div>
            )}
            {openpose && (
              <>
                <h3>keypoints:</h3>
                <ReactJson
                  src={openpose.keypoints}
                  collapsed={3}
                  theme="monokai"
                />
              </>
            )}
          </div>
          <div className="block">
            <h3>LIP_JPPNet</h3>
            <Loading loading={jppnetLoading} backdrop={false} />
            {jppnet && (
              <div>
                <img src={jppnet.vis} alt="" />
              </div>
            )}
          </div>
        </Paper>

        <Paper elevation={3}>
          <h2>Clothes Pre-Processing</h2>
          <p>
            You need to first remove the background of the clothes image
            somewhere else.
          </p>
          <p>
            For example try something like:{" "}
            <a
              href="https://remove.bg"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://remove.bg/
            </a>
            .
          </p>
          <p>Then upload the PNG here</p>
          {/* clothes input */}
          <input
            accept="image/png"
            style={{ display: "none" }}
            id="clothesInput"
            type="file"
            onChange={this.onUploadClothes}
          />
          <label htmlFor="clothesInput">
            <Button variant="contained" color="primary" component="span">
              Upload Image of Clothes
            </Button>
          </label>

          <div className="block">
            <h3>Resized Image (256x192)</h3>
            {clothUrl && (
              <div>
                <img src={clothUrl} alt="" />
              </div>
            )}
          </div>

          <div className="block">
            <h2>Clothes Mask</h2>
            <canvas id="clothMask"></canvas>
          </div>
        </Paper>
        <Paper elevation={3}>
          <h2>Final Try-On</h2>
          <p>
            Finish the above to part, then you can click this button to try-on!
          </p>
          <Button
            variant="contained"
            color="primary"
            component="span"
            onClick={this.callCpvton}
            disabled={
              !jppnet ||
              !jppnet.output ||
              !openpose ||
              !openpose.keypoints ||
              !clothMaskFile
            }
          >
            Try-On!
          </Button>

          <div className="block">
            <h3>cp-vton try-on result:</h3>
            <Loading loading={cpvtonLoading} backdrop={false} />
            {cpvton && (
              <>
                <div>
                  <img src={cpvton.tryon} alt="" />
                </div>
                <div>
                  <h4>warp cloth</h4>
                  <img src={cpvton.warpCloth} alt="" />
                </div>
                <div>
                  <h4>warp mask</h4>
                  <img src={cpvton.warpMask} alt="" />
                </div>
              </>
            )}
          </div>
        </Paper>
      </Wrapper>
    );
  }
}

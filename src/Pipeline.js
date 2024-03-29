/* globals cv */
import React from "react";
import styled from "styled-components";
import axios from "axios";
import { Button, Paper } from "@material-ui/core";
import ReactJson from "react-json-view";
import Jimp from "jimp/es";
import { store } from "react-notifications-component";

import { dataURL2file, loadOneImg, img2dataURL } from "./image-processing";
import Loading from "./Loading";
import modelImg from "./imgs/test-model.jpg";
import model2Img from "./imgs/test-model2.jpg";
import model3Img from "./imgs/uniqlo-model.png";
import model4Img from "./imgs/uniqlo-model2.jpg";
import clothBlueImg from "./imgs/test-blue.png";
import clothRedImg from "./imgs/test-red.png";
import clothGreenImg from "./imgs/test-green.png";
import clothPurpleImg from "./imgs/uniqlo-purple.png";
import clothGrayImg from "./imgs/uniqlo-short-gray.png";

const Wrapper = styled.div`
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  > .MuiPaper-root {
    padding: 1rem;
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

  .examples {
    overflow-x: auto;
    display: flex;
    align-items: center;
    > * {
      margin: 1rem;
    }
  }
  .example {
    display: inline-block;
    position: relative;
    img {
      width: 192px;
      height: 256px;
      object-fit: contain;
    }
    button {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
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
      .post("https://openpose-s3mg3fuleq-uc.a.run.app/", formData, {
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
        console.log(error);
        store.addNotification({
          title: "Error in Openpose",
          message: error.message,
          type: "danger",
          insert: "top",
          container: "top-right",
          dismiss: {
            duration: 0,
            showIcon: true,
          },
        });
      });

    axios
      .post("https://lip-jppnet-s3mg3fuleq-uc.a.run.app/", formData, {
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
        console.log(error);
        store.addNotification({
          title: "Error in LIP_JPPNet",
          message: error.message,
          type: "danger",
          insert: "top",
          container: "top-right",
          dismiss: {
            duration: 0,
            showIcon: true,
          },
        });
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
      .post("https://cpvton-s3mg3fuleq-uc.a.run.app/", formData, {
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
        console.log(error);
        store.addNotification({
          title: "Error in CP-VTON",
          message: error.message,
          type: "danger",
          insert: "top",
          container: "top-right",
          dismiss: {
            duration: 0,
            showIcon: true,
          },
        });
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

  onChooseModel = async (url) => {
    const img = await loadOneImg(url);
    const dataURL = img2dataURL(img);
    const file = dataURL2file(dataURL);
    this.onUploadModel({ target: { files: [file] } });
  };

  onChooseCloth = async (url) => {
    const img = await loadOneImg(url);
    const dataURL = img2dataURL(img);
    const file = dataURL2file(dataURL);
    this.onUploadClothes({ target: { files: [file] } });
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

          <h4>Upload your image or click one of the examples below</h4>
          <div className="examples">
            {/* model input */}
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="modelInput"
              type="file"
              onChange={this.onUploadModel}
              disabled={openposeLoading || jppnetLoading}
            />
            <label htmlFor="modelInput">
              <Button
                variant="contained"
                color="primary"
                component="span"
                disabled={openposeLoading || jppnetLoading}
              >
                Upload Image of Model
              </Button>
            </label>
          </div>

          <div className="examples">
            {[modelImg, model2Img, model3Img, model4Img].map((imgUrl) => (
              <div className="example" key={imgUrl}>
                <img src={imgUrl} alt="example model" />
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => this.onChooseModel(imgUrl)}
                  disabled={openposeLoading || jppnetLoading}
                >
                  Choose
                </Button>
              </div>
            ))}
          </div>

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
            <Loading
              key="openpose"
              loading={openposeLoading}
              backdrop={false}
            />
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
            <p>
              Because we use free Google Cloud Run, this step take around 60-120
              seconds.
            </p>
            <Loading key="jpp" loading={jppnetLoading} backdrop={false} />
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

          <h4>Upload your image or click one of the examples below</h4>
          <div className="examples">
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
          </div>

          <div className="examples">
            {[
              clothRedImg,
              clothBlueImg,
              clothGreenImg,
              clothGrayImg,
              clothPurpleImg,
            ].map((imgUrl) => (
              <div className="example" key={imgUrl}>
                <img src={imgUrl} alt="example clothes" />
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => this.onChooseCloth(imgUrl)}
                >
                  Choose
                </Button>
              </div>
            ))}
          </div>

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
            Finish the model pre-processing and clothes pre-processing parts,
            then you can click this button to try-on!
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

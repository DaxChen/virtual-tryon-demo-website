import React from "react";
import styled from "styled-components";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { Backdrop } from "@material-ui/core";

const StyledBackdrop = styled(Backdrop)`
  flex-direction: column;
  font-size: 26px;
  > * {
    margin: 0.5rem;
  }
  &.MuiBackdrop-root {
    z-index: 1301;
  }
`;

export default function Loading({
  backdrop = true,
  loading,
  size = 15,
  margin = 2,
  color = "#21cbf3",
  ...props
}) {
  return backdrop ? (
    <StyledBackdrop {...props} open={loading} style={{ color }}>
      <ClimbingBoxLoader
        loading={loading}
        size={size}
        margin={margin}
        color={color}
      />
      <div>Loading...Please Wait</div>
    </StyledBackdrop>
  ) : (
    <ClimbingBoxLoader
      {...props}
      loading={loading}
      size={size}
      margin={margin}
      color={color}
    />
  );
}

import React from "react";
import styled from "styled-components";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { Backdrop } from "@material-ui/core";

const Wrapper = styled.div`
  flex-direction: column;
  font-size: 20px;
  > * {
    margin: 0.5rem;
  }
`;
const StyledBackdrop = styled(Backdrop)`
  flex-direction: column;
  font-size: 20px;
  > * {
    margin: 0.5rem;
  }
  &.MuiBackdrop-root {
    z-index: 1301;
  }
`;

export default function Loading({
  backdrop = true,
  showText = true,
  loading,
  size = 15,
  margin = 2,
  color = "#21cbf3",
  ...props
}) {
  if (!loading) return null;

  return backdrop ? (
    <Wrapper className="loading" {...props}>
      <StyledBackdrop open={loading} style={{ color }}>
        <ClimbingBoxLoader
          loading={loading}
          size={size}
          margin={margin}
          color={color}
        />
        <div>Loading...Please Wait</div>
      </StyledBackdrop>
    </Wrapper>
  ) : (
    <Wrapper className="loading" {...props} style={{ color }}>
      <ClimbingBoxLoader
        {...props}
        loading={loading}
        size={size}
        margin={margin}
        color={color}
      />
      {showText && <div>Loading...Please Wait</div>}
    </Wrapper>
  );
}

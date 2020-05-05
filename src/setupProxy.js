const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/openpose",
    createProxyMiddleware({
      target: "https://openpose-s3mg3fuleq-uc.a.run.app",
      changeOrigin: true,
      pathRewrite: {
        "^/api/openpose": "",
      },
    })
  );

  app.use(
    "/api/lip_jppnet",
    createProxyMiddleware({
      target: "https://lip-jppnet-s3mg3fuleq-uc.a.run.app/",
      changeOrigin: true,
      pathRewrite: {
        "^/api/lip_jppnet": "",
      },
    })
  );

  app.use(
    "/api/cpvton",
    createProxyMiddleware({
      target: "https://cpvton-s3mg3fuleq-uc.a.run.app/",
      changeOrigin: true,
      pathRewrite: {
        "^/api/cpvton": "",
      },
    })
  );
};

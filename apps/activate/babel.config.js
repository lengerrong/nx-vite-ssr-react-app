module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      "@nrwl/react/babel",
      {
        "runtime": "automatic"
      }
    ]
  ];
  const plugins = [];

  return {
    presets,
    plugins
  };
}
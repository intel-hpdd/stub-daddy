module.exports = {
  rules: {
    quotes: [2, 'single'],
    'linebreak-style': [2, 'unix'],
    semi: [2, 'always'],
    indent: [2, 2],
    'no-func-assign': 0,
    'no-constant-condition': 0,
    'no-multiple-empty-lines': [2, {max: 2, maxEOF: 1}],
    curly: [2, 'multi', 'consistent'],
    'eol-last': [2, 'unix']
  },
  globals: {
    window: false,
    describe: false,
    beforeEach: false,
    afterEach: false,
    jasmine: true,
    spyOn: false,
    it: false,
    pit: false,
    console: false,
    expect: false,
    waits: false,
    waitsFor: false,
    runs: false
  },
  ecmaFeatures: {
    modules: true
  },
  env: {
    node: true
  }
};

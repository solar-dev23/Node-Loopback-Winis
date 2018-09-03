module.exports = {
  extends: ['loopback'],

  'parserOptions': {
    'ecmaVersion': 2018,
  },

  // add your custom rules here
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': ['error', {'code': 120}],
    'object-curly-spacing': ['error', 'always'],
    'one-var': 'off',
    'space-before-function-paren': ['error', {'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always'}],
    'strict': ['error', 'never']
  }
}

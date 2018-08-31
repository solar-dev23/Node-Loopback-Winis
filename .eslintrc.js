module.exports = {
  extends: ['loopback'],

  "parserOptions": {
    "ecmaVersion": 8
  },

  // add your custom rules here
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': ['error', {'code': 120}],
    'object-curly-spacing': ['error', 'always'],
    'one-var': 'off',
    'strict': ['error', 'never']
  }
}

import next from 'eslint-config-next';

export default [
  ...next(),
  {
    rules: {
      'react/react-in-jsx-scope': 'off'
    }
  }
];

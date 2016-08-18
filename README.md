# Turing-IncomTWEET

Auto-tweet episodes using Github hooks.

This project uses [apex](http://apex.run).
If you'd like to get this set up on your own code-wise:

1. Set up apex
2. Run `apex init` in this directory
3. Change `env.sample.js` to `env.js` and add your access token and profile IDs
4. Change various specific things to hit your github instead of Turing-Incomplete's ;)

On AWS:

1. `apex deploy`
2. Set up an [SNS queue for Github](https://aws.amazon.com/blogs/compute/dynamic-github-actions-with-aws-lambda/) and make that trigger your Lambda
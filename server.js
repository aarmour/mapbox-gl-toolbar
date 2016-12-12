const express = require('express');

const app = express();

app.use(express.static('demo'));
app.use(express.static('dist'));

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

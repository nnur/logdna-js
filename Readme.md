[view here](https://nnur.github.io/logdna-js/)

Notes: 
I implemented psuedo-pagination in main.js in getHosts because I assume that were we not
using mockjax, the server would provide that.

I also implemented a batch delete in deleteHosts that I again think shouldn't be necessery
since the server would have a batch delete. If not, I would wrap it this way anyway.

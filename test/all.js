var tape = require('tape'),
	mdk = require('../index');


tape("hello tape", function(t){
	t.plan(1);

	t.assert(true, "it works!");
});

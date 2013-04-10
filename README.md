#Yolo
Yolo is MVC WebFramework written in Nodejs heavily inspired by ruby on rails. It powers our Heythere servers. 


##Install
__Yolo requires nodejs, couchdb and redis to run__
```sh
$ npm install yolo
$ npm install yolo-cli -g
```
##Start

```js
var Yolo = require('./yolo'),
	server = new Yolo();

server.run({
	app : 'app/',
	config : 'config/'
});
```


##Models
Yolo.Model is basiclly a Backbone.Model extended with validation and a couchdb layer. Models go into `app/models` and are loaded automaticlly if Yolo boots. 
You define a model by extending the Yolo.Model:
```js
module.exports = Yolo.Model.extend({ 		
	//…
});
```
###Scaffolding
Generate Models easily with the generator.js . This would generate a model named "post" with attributes title, content and author and title would be required field.

```bash
$ node generate.js model post title:required content author
```

Find out more options via 
```bash 
$ node generate.js
```
###Attributes
You can define attributes for each model with default values and validation rules:
```js
attributes : {
		firstName : {
			required : true
		},
		lastName : {
			required : true,
		},
		email : {
			pattern : 'email',
		},
		password : {
			required : true,
			minLength : 5,
			sanitize : false
		},
		bio : {
			required : false,
			maxLength : 180
		},
		lastLogin : {
			"default" : new Date()
		},
		friends : {
			"default" : [],
		}
	}
```
Default values will be set if the attribute is not set with a value and validators will be checked before the model is saved to db or manual via [.isValid()](https://github.com/wemakeweb/heythere_appserver#isvalid).

Full list of available validations:
https://github.com/thedersen/backbone.validation#required

###Views
Views are the couchdb way to query the database. Views consists of a **map** and a **reduce** function. However,
views for each attribute will be autogenerated while booting. For example if your model has a attribute
**firstName** we generate **Model.findByFirstName** for you. 
You can define additional views with the 'views' property which will be callable after booting:
```js
views : {
	myCustomView : {
		map : function(doc){
			// for eg emit(doc)
		},
		reduce : function(){
			
		}
	}
}
```
This view would then be callabble via **Model.myCustomView**. The views will be saved as design document to couchdb.
###Working with Models
####get
Use **Model.get(key)** to get attributes from a model:
```js
var user = new User();
user.get('firstName');
```
####set
Use **Model.set(key, value)** or **Model.set({ key1: value1})** to set attributes to the model:
```js
var user = new User();
user.set('firstName');
```

If you initialize a new model you can pass an object of keys and values which will be set, to the constructor:
```js
var user = new User({
	name : params.name,
	email : params.email
});
user.get('name');
```
####save
Save a model with **save(options)** to the database like so:
```js
var user = new User({
	name : params.name,
	email : params.email
});

user.save({
	success : function(){
		console.log("saved");
	},
	error : function(){
		console.log("save failed");
	}
});
```
__Note__: Only valid models will be saved to database. You should call **Model.isValid()** before to check that.
####isValid
To check if a model is valid:
```js
if( ! user.isValid() ){
	console.log(model.validationError)
}
```
####attach(name, mimeType, buffer)
You can attach files to models which will be stored as attachments to couchdb via:
```js
user.attach('profile', 'image/jpeg', imgBuffer);
```
After saving this to database you can get those attachments, for example in a template via:
```js
user.attachments('profile').url
```

##Controllers
Controllers take the main part in handling incoming requests and processing them.
###Scaffolding
Generate Controllers easily with the generator.js . This would generate a controller namend "posts" with methods index, edit and delete. Method "edit" will be acessabble via 'POST' and "delete" via 'DELETE'. Routes to those methods will be added automatically.

```bash
$ node generate.js controller posts index edit:post delete:delete
```

Find out more options via 
```bash
$ node generate.js
```


A controller consists of a group of methods which handle one type of request defined in the **route**. Example:
```js
module.exports = Yolo.Controller.extend({
	index : function(params){
		this.renderHTML("dashboard/index", {user : this.currentUser });
	}
});
```
The params object passed to each method contains every parameter that might be passed to the server. In the methods you have access to the following methods:
###this.renderHTML(path, options = {})
Renders and returns a Html Template at **path**. Everything into the options object will be available as variable in the template.

###this.renderJSON(options = {})
Returns a JSON Object containing the options.

###this.redirect(path)
Redirects the Request to **path**
###this.currentUser
If the user has a valid session eg he is logged in the **this.currentUser** will contain the current user object.

##Routes
The routes file in the config directory contains all the individual routes to the controllers. A route consists of a **key** and a **value**.
The **key** is the string we pass as "path" variable to express the path can also contain dynamic parts - read more about more here http://expressjs.com/api.html#app.VERB .

The **value** is either a object or an array of objects if the path should match different http methods. 

###Example:
```js		
"user/:id" : { 	
	//routes to the controller named 'User' and the method named 'set'
	to : 'User.set',
	
	//the http method the route should match. can be either get, post, put or delete
	via : 'post',

	//set false if the request dont have to be authorized
	authorized : false
}
```
You can even match two routes to the same path but with different http methods like so:
```js
'user/register' : [{
	to : 'Users.registerForm',
	via : 'get',
},
{
	to : 'Users.register',
	via : 'post',

}]
```

__Note:__ Each route will be checked while booting Yolo if the **to** parameters matches a controller.

##Templates
We use the ejs Template Engine extend with ejs-locals. Ejs lets you write javascript code into Templates like so:
```js
<% if (currentUser) { %>
    <h2><%= currentUser.get("name") %></h2>
<% } %>
```
Unbuffered code for conditionals etc <% code %>
Escapes html by default with <%= code %>
Unescaped buffering with <%- code %>

Documentation can be found here: https://github.com/visionmedia/ejs and here: https://github.com/publicclass/express-partials

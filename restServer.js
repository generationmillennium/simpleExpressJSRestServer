var express = require('express');
var fs = require("fs");
var app = express();
var mysql = require('mysql2');
var bodyParser = require('body-parser');
var validator = require('mysql-validator');

var settings = JSON.parse(fs.readFileSync('./../settings.json', 'utf8'));
var connection = mysql.createConnection({host:settings.dbhost, user: settings.dbuser, password: settings.dbpassword, database: settings.database});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8001");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

/*
	GET People Endpoint; GET all people or one person by ID
	
	e.g.
	GET http://localhost:9001/people would return all people
	GET http://localhost:9001/people/1 would return one person with ID '1' from the DB
*/
app.get('/people/:id*?', function (req, res) {
	var personID = parseInt(req.params.id);

	function getPeople(personID){
		if(personID && typeof personID === 'number' && Number.isInteger(personID)){
	        connection.query('SELECT * FROM `People` WHERE `personID` = ?',[personID] ,function (err, results, fields) {
				res.send(results);
	        });
	    }else{
	        connection.query('SELECT * FROM `People`', function (err, results, fields) {
				res.send(results);
	        });
	    }
	}

	getPeople(personID);
});

/*
	POST People Endpoint; creates a person record

	ex. Person object to be POSTed in BODY of the HTTP request
	{
		"firstName":"John",
		"lastName":"Doe",
		"streetAddress":"123 Main St"
		"city":"Seattle",
		"state":"WA",
		"zip":"98101"
	}
*/
app.post('/people', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	var person = req.body;

	function postPeople(person){
		if(person.firstName.length > 2 && !validator.check(person.firstName, 'varchar(255)') && person.lastName.length > 2 && !validator.check(person.lastName, 'varchar(255)')  && !validator.check(person.streetAddress, 'varchar(255)') && person.streetAddress.length > 2 && !validator.check(person.state, 'varchar(255)') && person.state.length >= 2 && !validator.check(person.city, 'varchar(255)') && person.city.length > 2 && person.zip.length === 5 && !validator.check(person.zip, 'varchar(255)')){
			connection.query('INSERT INTO People (firstName,lastName,streetAddress,city,state,zip) VALUES (?,?,?,?,?,?)', [person.firstName,person.lastName,person.streetAddress,person.city,person.state,person.zip],function (err, results, fields) {
				if(results.affectedRows > 0){
					res.send(person);
				}else{
					res.send({"error":"could not insert this person","person":{person}});
				}
        	});
		}
	}
	postPeople(person);
});

app.listen(9001, function (app) {
  console.log('REST Server running on port 9001.');
});
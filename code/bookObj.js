#pragma strict
import System.Collections;
import System.Net;
import System.IO;

import UnityEngine;
import SimpleJSON;
import System;
//using System.Collections;


class bookObj extends MonoBehaviour {

	// variables for position of the book object
	private var xPos : float;
	private var yPos : float;
	private var zPos : float;

	// variables for information about the book
	private var title : String;
	private var subTitle : String;
	private var author : String;
	private var ISBN : String;
	private var publisher : String;
	private var location : String = "";
	private var country : String = "";
	private var hyperLink : String = "";

	// components of the object that will be modified
	private var block : GameObject;
	private var text : GameObject;
	private var desText : GameObject;
	private var textSpine : GameObject;
	private var count : int = 0;
	private var oldRotation : Vector3;
	private var award : boolean = false;
	var mat2 : Material; 

	// variables for establishing connection with database
	private var connection : String;
	private var dbcon : IDbConnection;
	private var dbcmd : IDbCommand;
	private var reader : IDataReader;
	private var DatabaseName : String = "";

	//How quickly to rotate the object.
	var sensitivityX:float = 400;
	var sensitivityY:float = 400;
	 
	//Camera that acts as a point of view to rotate the object relative to.
	var referenceCamera : Transform;

	// initiates information about the book
    function check (hyp: String, nB : GameObject, nT : GameObject, nD : GameObject, nS: GameObject, 
    				mat : Material, iS : String, loc : String, cid : int, aw : boolean){
		hyperLink = hyp;
		block = nB;
		text = nT;
		desText = nD;
		textSpine = nS;
		mat2 = mat;
		ISBN = iS;
		location = loc;
		award = aw;
		// gets country of publication
		getLocation();
    }

   
    // establishes connection with database
    function OpenDB(p : String) {
	    connection = "URI=file:" + p; // we set the connection to our database
	    dbcon = new SqliteConnection(connection);
	    dbcon.Open();
	    }

	 // Sqlite query
	    function BasicQuery(q : String, r : boolean):IDataReader{ // run a baic Sqlite query
	        dbcmd = dbcon.CreateCommand(); // create empty command
	        dbcmd.CommandText = q; // fill the command
	        reader = dbcmd.ExecuteReader(); // execute command which returns a reader
	        if(r) { // if we want to return the reader
	            return reader; // return the reader
	        }
	    }

	// this function launches when the object is created and opens database connection
	function Start () {
		// establishes database connection
	 	DatabaseName = Application.dataPath + "/StreamingAssets/awardMarc.db";
	 	OpenDB(DatabaseName);
		block.transform.rotation = Quaternion.identity;
		block.transform.Rotate(270,90,0);

		// checks if there is a main reference camera. Used later for rotation.
		if (!referenceCamera) {
           if (!Camera.main) {
                 Debug.LogError("No Camera with 'Main Camera' as its tag was found. Please either assign a Camera to this script, or change a Camera's tag to 'Main Camera'.");
                 Destroy(this);
                 return;
                }
            referenceCamera = Camera.main.transform;
        }
	}

	// this function rotates the object according to mouse movement
	function Update () {

		if (count != 0){
			//Get how far the mouse has moved by using the Input.GetAxis().
	        var rotationX:float = Input.GetAxis("Mouse X") * sensitivityX;
	        var rotationY:float = Input.GetAxis("Mouse Y") * sensitivityY;
	        var rX : float = -(Input.GetAxis("Mouse X") * sensitivityX);
	 
			// rotates all the objects associated with the book
	        block.transform.RotateAround(block.transform.position, Vector3.up, -Mathf.Deg2Rad * rotationX );
	        text.transform.RotateAround(block.transform.position, Vector3.up, -Mathf.Deg2Rad * rotationX );
	        desText.transform.RotateAround(block.transform.position+Vector3(0,0,0.1), Vector3.up, -Mathf.Deg2Rad * rotationX );
	        textSpine.transform.RotateAround(block.transform.position+Vector3(0,0,0.1), Vector3.up, -Mathf.Deg2Rad * rotationX );

        }

	}

	function getLocation(){

		// if there is an award retrieves award image and creates material out of it
		// and applies on the book
		if (award){
			// sets up object's materials for changing
			var mas2 : Material;
			var tex2 : Texture = null;
			var fileData2 : byte [];
			var url2 = "http://orig09.deviantart.net/826e/f/2016/241/e/4/trophy_by_scarecrow0604-daft3h7.jpg";
			mas2 = new Material (Shader.Find("Diffuse"));
			var mt2 : Material [];
			var ma2 : Material;
			ma2 = new Material (Shader.Find(" Diffuse"));
			mt2 = block.GetComponent.<Renderer>().materials;
			ma2.mainTexture = new Texture2D(4, 4, TextureFormat.DXT1, false);

			// retrieves award image
			var www2 = new WWW(url2);
			// wait until the download is done
			yield www2;
			// assign the downloaded image to the main texture of the object
			www2.LoadImageIntoTexture(ma2.mainTexture);
			// changes award component of the book
			mt2[6] = ma2;
			block.GetComponent.<Renderer>().materials = mt2;
		}

		// formats locations retrieved from database into uniform format
		if (location.Length > 2){
			location = location.Substring(0, location.length-2);
		}
		var locarray : Array = new Array();
		for (var a = 0; a< location.Length; a++){
			if (location[a] == ' '){
				
			}else {
				locarray.Push(location[a]);
			}
		}
		location = locarray.Join("");

		// uses google map api to find predicted country of the location 
		var ur2 : String = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input="+location+"&types=(regions)&key=AIzaSyAT8FT3em39Kufcr0RIABO2xzrA7ip4n9g";
		var openUr2 = new WWW(ur2);
		yield openUr2;
		if (openUr2.error == null){
		    var parsedS = JSON.Parse(openUr2.text);
		    // picks top prediction
		    var terms = parsedS["predictions"][0]["terms"];
		    country = "";
		    var loop = 0;
		    // retrieves country information
		    if (terms != null){
			    for (var x in terms){
			    	country = terms[loop]["value"];
			    	loop++;
			    }
			}
		    
		    var url = "";
		    // if the country is united states, it simply retrieves flag of US.
		    // else it looks up country code of the country in the database and
		    // uses it in api call to retrieve flag of that country.
		    if (country == "United States"){
		    	// uses geognos api to retrieve flag of US
		    	url = "http://www.geognos.com/api/en/countries/flag/US.png";
	            
	        } else {
				// retrieves country code based on country name 
	        	var query = "SELECT * FROM MARC_COUNTRY WHERE COUNTRY LIKE \"" + country + "\"";
		        var code = BasicQuery(query, true);
		        // uses geognos api to retrieve flag corresponding to the country code.
		        url = "http://www.geognos.com/api/en/countries/flag/" + code[1] + ".png";

	        }

	        // sets up object materials for applying country flag
			var mas : Material;
			var tex : Texture = null;
			var fileData : byte [];

			mas = new Material (Shader.Find("Diffuse"));
			var mt : Material [];
			var ma : Material;
			ma = new Material (Shader.Find(" Diffuse"));
			mt = block.GetComponent.<Renderer>().materials;
			ma.mainTexture = new Texture2D(4, 4, TextureFormat.DXT1, false);

			// Start a download of the given URL
			var www = new WWW(url);
			// wait until the download is done
			yield www;
			// assign the downloaded image to the main texture of the object
			www.LoadImageIntoTexture(ma.mainTexture);
			// applies country flag to the book object
			mt[4] = ma;
			block.GetComponent.<Renderer>().materials = mt;
		} 
	}

	// different type of rotation if user drags over the object
    function OnMouseDrag()
    {
    	var rotSpeed : float = 20;
        var rotX : float = Input.GetAxis("Mouse X")*rotSpeed*Mathf.Deg2Rad;
        var rotY : float = Input.GetAxis("Mouse Y")*rotSpeed*Mathf.Deg2Rad;

        // book rotation
        block.transform.RotateAround(Vector3.up, -rotX);
        block.transform.RotateAround(Vector3.right, rotY);

        text.transform.RotateAround(block.transform.position, Vector3.up, -rotX );
	    desText.transform.RotateAround(block.transform.position+Vector3(0,0,0.1), Vector3.up, -rotX );
	    textSpine.transform.RotateAround(block.transform.position+Vector3(0,0,0.1), Vector3.up, -rotX );

	    text.transform.RotateAround(block.transform.position, Vector3.right, -rotY );
	    desText.transform.RotateAround(block.transform.position+Vector3(0,0,0.1), Vector3.right, -rotY );
	    textSpine.transform.RotateAround(block.transform.position+Vector3(0,0,0.1), Vector3.right, -rotY );

    }

    // activates an object when it's clicked.
	function OnMouseDown () {

	    var url : String;
	    var width : int = 1;
	    //Uses google api to obtain info about the book
		var ur : String = "https://www.googleapis.com/books/v1/volumes?q=isbn:"+ISBN;
		var ww = new WWW(ur);

		//Load the data and yield (wait) till it's ready before we continue executing the rest of this method.
		yield ww;
		if (ww.error == null) {
		      //Sucessfully loaded the JSON string
		      var parsedString = JSON.Parse(ww.text);

		      // retrieves cover image from google book api call
		      if (parsedString["items"][0]["volumeInfo"]["imageLinks"]["thumbnail"] != null){
		      	
		      	url = parsedString["items"][0]["volumeInfo"]["imageLinks"]["thumbnail"];
		      	//Sets up materials of object for applying cover image.
				var mas : Material;
				var tex : Texture = null;
				var fileData : byte [];
				mas = new Material (Shader.Find("Diffuse"));
				var mt : Material [];
				var ma : Material;
				ma = new Material (Shader.Find(" Diffuse"));
				mt = block.GetComponent.<Renderer>().materials;
				ma.mainTexture = new Texture2D(4, 4, TextureFormat.DXT1, false);

				// Start a download of the given URL
				var www = new WWW(url);
				// wait until the download is done
				yield www;
				// assign the downloaded image to the main texture of the object
				www.LoadImageIntoTexture(ma.mainTexture);
				mt[2] = ma;
				block.GetComponent.<Renderer>().materials = mt;
				// text on cover page disappears if there is a cover image
				text.GetComponent.<Renderer>().enabled = false;

		 	  } 

		 	  // retrieves page count from google books api call
		 	  if (parsedString["items"][0]["volumeInfo"]["pageCount"] != null && count == 0){
		 	  	
		 	  	width = parseInt(parsedString["items"][0]["volumeInfo"]["pageCount"]);

		 	  	// maximum cap of width
		 	  	if (width > 12){
		 	  		width = 12;
		 	  	}
		 	  	// applies relative width
		 	  	block.transform.localScale += new Vector3(0.03 * width, 0.0 , 0.0);
		 	  	text.transform.position += Vector3(0, 0, 0.0005 * width);
				desText.transform.position += Vector3(0, 0, -0.0005 * width);
		 	  }
		    }
		    else {
		      Debug.Log("ERROR: " + ww.error);
		    }

		// keeps track whether the object was clicked before. If it wasn't clicked before,
		// moves the object forward, moves it back to original position otherwise.
		if (count == 0){
			// moves object forward
			//Debug.Log(hyperLink);
			block.transform.position += Vector3(0, 0, 0.5);
			text.transform.position += Vector3(0, 0, 0.5);
			desText.transform.position += Vector3(0, 0, 0.5);
			textSpine.transform.position += Vector3(0, 0, 0.5);
			count += 1;
			//Application.OpenURL(hyperLink);
		} else {
			// moves object back to original position
			block.transform.position += Vector3(0, 0, -0.5);
			text.transform.position += Vector3(0, 0, -0.5);
			desText.transform.position += Vector3(0, 0, -0.5);
			textSpine.transform.position += Vector3(0, 0, -0.5);

			block.transform.rotation = Quaternion.identity;
			block.transform.Rotate(270, 90, 0);
			text.transform.rotation = Quaternion.identity;
			desText.transform.rotation = Quaternion.identity;
			text.transform.Rotate(0,180,0);
			count = 0;
		}			
	}
}



	public var DatabaseName : String;
	 
	// This is the name of the table we want to use
	public var TableName : String = "MARC_DB";
	public var TableName2 : String = "MARC_FIELDS_SHORT";

	// These variables are for reading database
	var id : String = "id:";
	var title : String = "title";
	var marc : String = "marc"; 
	var DatabaseEntryStringWidth = 100;
	var scrollPosition : Vector2;
	var databaseData : ArrayList = new ArrayList();
	var databaseData2 : ArrayList = new ArrayList();

	// these variables contain objects from the scene
	var node1 : Transform ;
	var block : GameObject;
	var oldBlock : GameObject;
	var uniBlock : GameObject;
	var oldUniBlock : GameObject;
	var newBlock : GameObject;
	var mat1 : Material;
	var textmat : Material;
	var font : Font;

	// variables for database connection
	private var connection : String;
	private var dbcon : IDbConnection;
	private var dbcmd : IDbCommand;
	private var reader : IDataReader;


	// Opens connection with db
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

	   
	 // wraps strings so that text doesn't cross width or height limit
	 function WrapText(width : int, str : String, heightT : int){

	    var cur : int = 0;
	    var slice : int = width;
	    var wrapString : String = "";
		var lenStr = str.Length;
		var heightI : int = 0;

	    while (cur < lenStr && heightI < heightT){
	    	if (lenStr < slice){
	            slice = lenStr;
	      	}
	      	// If textt length crosses width limit, goes to next line.
	      	wrapString += str.Substring(cur,slice - cur) + "\n";
	        cur += width;
	        slice += width; 
	        heightI++;
	    }
	    return wrapString;
    }

    // reads data from database and serves main functionalities
	function ReadFullTable2(tableName : String) {

		var query : String;
	    var count : int;

	    // variables for different fields
	    var curStr: String;
	    var curReader: String;
	    var curCid : int;
	    var curSubField : String;
	    var curField : String;
	    var curFieldData: String;

	    // variables for storing position
	    var x : float;
	    var y : float;
	    var z : float;
	    var target: int;

	    // variables for database response
	    var ISBN : boolean = true;
	    var ISBNval : String = "";

	    var title : String = "";
	    var subTitle : String = "";

	    var ind : int;
        var author : String = "";
        var editor : String = "";
        var publisher : String = "";
        var date : String = "";
        var dateInt : int = 2015;

        var alphaNumeric : String = "";
        var alphaNumericA : String = "";
        var alphaNumericB : String = "";

        var hyperlink : String = "";
        var location : String = "";
        var description : String = "";

        var recordArray = new Array();
        var bookAward : boolean = false;

        // cid of first record
        var comp = 5;

        //initial position of objects
	    x = -45;
	    y = 0;
        z = -45;

        //target is the number of books in a row count keeps track 
        //of no. of books in current row

        target = 25;
        count = 0;

	    // Calls database
	    query = "SELECT * FROM " + tableName + " LIMIT 905";
	    dbcmd = dbcon.CreateCommand();
	    dbcmd.CommandText = query; 
	    reader = dbcmd.ExecuteReader();
	    var readArray = new ArrayList();

	    // parsing response from database response
	    while(reader.Read()) {
	        	 
            var lineArray = new ArrayList();

	        // gets relevant data of current record
	        curCid = reader.GetValue(0);
	        curField = reader.GetValue(2);
	        curSubField = reader.GetValue(5);
            curFieldData = reader.GetValue(6);

            // if cid has changed it implies the book has changed
            if (curCid != comp){
				// updates tracking variables
	           	comp = curCid;
	           	ISBN = true;
	           	curStr = title + "\n" + subTitle + "\n" + ISBNval + "\n";
	           	alphaNumeric = alphaNumericA + alphaNumericB;

	            // creates a dictionary with all info about current object
	            var curRecord = { "cid" : curCid,
	           					  "titleV" : title,
	           					  "subTitleV" : subTitle,
	           					  "ISBNV" : ISBNval,
	           					  "alphaNum" : alphaNumeric,
	           					  "publisherV" : publisher,
	           					  "authorV" : author,
	           					  "editorV" : editor,
	           					  "hyperlinkV" : hyperlink,
	           					  "locationV" : location,
	           					  "descriptionV" : description,
	           					  "dateV" : dateInt,
	           					  "awardV" : bookAward
            					 };
            	//pushes current dictionary into array
	           	recordArray.Push(curRecord);

		        //resets relevant values
		        author = "";
		        editor = "";
	            subTitle = "";
	            location = "";
	            description = "";
	            bookAward = false;
	
          } else if (curField == "020" && curSubField == "a" && ISBN){
	          	// ISBN field
	           	ISBN = false;
	           	ISBNval = curFieldData;

          } else if (curField == "245" && curSubField == "a"){
	            // book title field
	            title = curFieldData;

	      } else if (curField == "245" && curSubField == "b"){
	       		// book subtitle field
	            subTitle = curFieldData;

	      } else if (curField == "260" && curSubField == "b"){
	            // book publisher field
	           	publisher = curFieldData;

	      } else if (curField == "050" && curSubField == "a"){
	            // alphanumeric order 1
	            alphaNumericA = curFieldData;

	      } else if (curField == "050" && curSubField == "b"){
	            // alphanumeric order 2
	           	alphaNumericB = curFieldData;

	      } else if (curField == "100" && curSubField == "a"){
	            // flips author's last name and first name.
	            var first : String = "";
	            var second : String = "";
	            var spl = curFieldData.Split(","[0]);
	            if (spl.length == 2){
	            	first = spl[0];
	            	second = spl[1];
	           	}
	           	author = second + " " + first;

	       } else if (curField == "245" && curSubField == "c"){
	           	// editor field data
	           	editor = curFieldData;

	       } else if (curField == "856" && curSubField == "u"){
            	// hyperlink field
	            hyperlink = curFieldData;

	       } else if (curField == "260" && curSubField == "a"){
	           	// location field
	           	location = curFieldData;

	       } else if (curField == "520" && curSubField == "a"){
	            // book description
	           	description = curFieldData;
	       } else if (curField == "260" && curSubField == "c" && curFieldData != ""){
	       		// publication year
	            date = curFieldData;
	         	// takes care of different forms of date
	            if (date.IndexOf("[") == -1 && date.Length > 4){
	           		date = date.Substring(0,4);

	            } else if (date.Length > 5){
	           		date = date.Substring(1,4);

            	} 
	            dateInt = parseInt(date);
	       }

		   // arbitarily assigns award
	       if (bookAward == false){
	            bookAward = true;
	       } else {
	           	bookAward = false;
	       }
	   }
	        // sorts records according to alphanumeric order
	   recordArray.Sort(function(a, b) {
	      	if (a != null && b != null){
		    	String.Compare(a["alphaNum"],b["alphaNum"]);
	   		} 
		});

		for (var j = 0; j < recordArray.length; j++){

			if (recordArray[j] != null){

				count++;
				// extracts information about each book
				var ci  = recordArray[j]["cid"];
				var ti : String = recordArray[j]["titleV"];
		 		var st : String = recordArray[j]["subTitleV"];
		 		var IS : String = recordArray[j]["ISBNV"];
		 		var au : String = recordArray[j]["authorV"];
		 		var loc : String = recordArray[j]["locationV"];
		 		var ed : String = recordArray[j]["editorV"];
		 		var des : String = recordArray[j]["descriptionV"];
		 		var year : int = recordArray[j]["dateV"];
		 		var award : boolean = recordArray[j]["awardV"];
		 		publisher = recordArray[j]["publisherV"];

			 	// relative position. Will need to be modified if more books are added
		        if (count>= target){
		           	y += 1;
		            x = x + 10;
		           	target += 25;
		        }
		        x += 2;

		        // creates text object for spine
		        var wrapSpine = WrapText(60, ti, 1) + WrapText(60, st, 1) + WrapText(60, au, 1);
		        if (String.Compare(ed, "")){
						wrapSpine += WrapText(60, ed, 1);
				}

		        var textSpine = new GameObject();
	            var textMeshSpine = textSpine.AddComponent(TextMesh);

	            textMeshSpine.color = Color.black;
	            textMeshSpine.font = font;

		        var rendSpine = textSpine.GetComponentInChildren.<MeshRenderer>();

             	rendSpine.material = textMeshSpine.font.material;
             	textMeshSpine.text = wrapSpine;

             	// sets relative position, rotation and scale of spine text
		        textSpine.transform.position = Vector3(x + 1.2, y + 1.12, z + 0.08);
		        textSpine.transform.localScale += new Vector3(-.975,-.975,-.975);
		        textSpine.transform.Rotate( Vector3(0,270,270));

		        // creates text object for description on the back
		        var textDes = new GameObject();
		        var textDesMesh = textDes.AddComponent(TextMesh);

		        textDesMesh.color = Color.black;
		        textDesMesh.font = font;

		        var wrapped = WrapText(45, des, 20);
		        var rendDes = textDes.GetComponentInChildren.<MeshRenderer>();

             	rendDes.material = textDesMesh.font.material;
             	textDesMesh.text = wrapped + "\n";

             	// sets relative position and scale of description text
             	textDes.transform.position = Vector3(x + 0.3, y + 1.1, z - 0.15);
		        textDes.transform.localScale += new Vector3(-.975,-.975,-.975);

		        // creates text object for info on the front
		        wrapString2 = WrapText(30, ti, 3) + "\n" + WrapText(30, st, 3) + "\n" + WrapText(30, au, 3);
		        if (String.Compare(ed, "")){
					wrapString2 += "\n" + WrapText(30, ed, 3);
				}

	            var texto = new GameObject();
	            var textMesh = texto.AddComponent(TextMesh);

	            textMesh.color = Color.black;
	            textMesh.font = font;

		        var rend = texto.GetComponentInChildren.<MeshRenderer>();

             	rend.material = textMesh.font.material;
           		textMesh.text = wrapString2;

           		// sets relative position, scale and rotation of front text
		        texto.transform.position = Vector3(x + 1.1, y + 1, z + 0.2);
	            texto.transform.localScale += new Vector3(-.965,-.965,-.965);
	            texto.transform.Rotate( Vector3(0,180,0));

		        // checks if it's university publication or not. depending, loads different prefabs
	            if (((publisher.IndexOf("university") != -1) || (publisher.IndexOf("University"))) && year > 2013){
	           		newBlock = Instantiate(uniBlock,node1.transform.position,node1.transform.rotation);
            		newBlock.transform.position = Vector3(x + 0.7, y, z);

	           	} else if(((publisher.IndexOf("university") != -1) || (publisher.IndexOf("University"))) && year <= 2013){
	           		newBlock = Instantiate(oldUniBlock,node1.transform.position,node1.transform.rotation);
            		newBlock.transform.position = Vector3(x + 0.7, y, z);

            	} else if (year > 2013){ // if the book is new
            		newBlock = Instantiate(block,node1.transform.position,node1.transform.rotation);
	            	newBlock.transform.position = Vector3(x + 0.7, y, z);

	           	} else { // if the book is old
		           	newBlock = Instantiate(oldBlock,node1.transform.position,node1.transform.rotation);
		           	newBlock.transform.position = Vector3(x + 0.7, y, z);

	            }

	            // adds physics to the object
	            newBlock.AddComponent.<BoxCollider>();
	            // intializes object interaction
	           	var book = newBlock.AddComponent.<bookObj>();
	           	book.check(recordArray[j]["hyperlinkV"],newBlock, texto, textDes,textSpine, mat1, IS, loc, ci, award);
	    	}
			
		}
	    return readArray; // return matches
    }

	// six following functions are for future use when the database will be dynamic.			
	// This function deletes all the data in the given table.  Forever.  WATCH OUT! Use sparingly, if at all
 	function DeleteTableContents(tableName : String) {
	    var query : String;
	    query = "DELETE FROM " + tableName;
	    dbcmd = dbcon.CreateCommand();
	    dbcmd.CommandText = query; 
	    reader = dbcmd.ExecuteReader();
	    }
	 
    function CreateTable(name : String, col : Array, colType : Array) { // Create a table, name, column array, column type array
       	var query : String;
	   	query  = "CREATE TABLE " + name + "(" + col[0] + " " + colType[0];

	   	for(var i=1; i<col.length; i++) {
       		query += ", " + col[i] + " " + colType[i];
       	}

        query += ")";
        dbcmd = dbcon.CreateCommand(); // create empty command
        dbcmd.CommandText = query; // fill the command
        reader = dbcmd.ExecuteReader(); // execute command which returns a reader	 
    }
	 
	function InsertIntoSingle(tableName : String, colName : String, value : String) { // single insert 
        var query : String;
        query = "INSERT INTO " + tableName + "(" + colName + ") " + "VALUES (" + value + ")";
        dbcmd = dbcon.CreateCommand(); // create empty command
        dbcmd.CommandText = query; // fill the command
        reader = dbcmd.ExecuteReader(); // execute command which returns a reader
    }
	 
    function InsertIntoSpecific(tableName : String, col : Array, values : Array) { // Specific insert with col and values
        var query : String;
        query = "INSERT INTO " + tableName + "(" + col[0];
        for(var i=1; i<col.length; i++) {
            query += ", " + col[i];
        }
        query += ") VALUES (" + values[0];
        for(i=1; i<values.length; i++) {
            query += ", " + values[i];
        }
        query += ")";
        dbcmd = dbcon.CreateCommand();
        dbcmd.CommandText = query; 
        reader = dbcmd.ExecuteReader();
    }
	 
    function InsertInto(tableName : String, values : Array) { // basic Insert with just values
        var query : String;
        query = "INSERT INTO " + tableName + " VALUES (" + values[0];
        for(var i=1; i<values.length; i++) {
            query += ", " + values[i];
        }
        query += ")";
        dbcmd = dbcon.CreateCommand();
        dbcmd.CommandText = query; 
        reader = dbcmd.ExecuteReader(); 
    }
	 
    // This function reads a single column
    //  wCol is the WHERE column, wPar is the operator you want to use to compare with, 
    //  and wValue is the value you want to compare against.
    //  Ex. - SingleSelectWhere("puppies", "breed", "earType", "=", "floppy")
    //  returns an array of matches from the command: SELECT breed FROM puppies WHERE earType = floppy;
    //function SingleSelectWhere(tableName : String, itemToSelect : String, wCol : String, wPar : String, wValue : String):Array { // Selects a single Item
    function SingleSelectWhere(tableName : String, itemToSelect : String, wCol : String, wPar : String, wValue : String):List.<String>{ // Selects a single Item
        var query : String;
        query = "SELECT " + itemToSelect + " FROM " + tableName + " WHERE " + wCol + wPar + wValue; 
        dbcmd = dbcon.CreateCommand();
        dbcmd.CommandText = query; 
        reader = dbcmd.ExecuteReader();
        //var readArray = new Array();
        var readArray:List.<String> = new List.<String>();
        while(reader.Read()) { 
            //readArray.Push(reader.GetString(0)); // Fill array with all matches
            var japanese:String = reader.GetString(0);
            Debug.Log(japanese);
            readArray.Add(japanese); // Fill array with all matches
            var url:String = reader.GetString(1);
            Debug.Log(url);
            readArray.Add(url); // Fill array with all matches
        }
	        return readArray; // return matches
	    }

	// terminates database connection
    function CloseDB() {
        reader.Close(); // clean everything up
        reader = null; 
        dbcmd.Dispose(); 
        dbcmd = null; 
        dbcon.Close(); 
        dbcon = null; 
    }


	function Start() {
		
		// initates database
	    DatabaseName = Application.dataPath + "/StreamingAssets/awardMarc.db";
	    OpenDB(DatabaseName);
	    // Let's make sure we've got a table to work with as well!
	    var tableName = TableName;
	    var tableName2 = TableName2;
	    var columnNames = new Array("id","title", "marc");
	    var columnValues = new Array("integer primary key", "text","text");
	    try {
	        CreateTable(tableName,columnNames,columnValues);
	    }
	    catch(e) {// Do nothing - our table was already created
	        //- we don't care about the error, we just don't want to see it
	    }

	    // reads records from short table in the database
	    databaseData2 = ReadFullTable2("MARC_FIELDS_SHORT");
	}


	function Update () {
	    // -------------------Code for Zooming Out------------
	    if (Input.GetAxis("Mouse ScrollWheel") < 0)
	        {
	            if (Camera.main.fieldOfView<=125)
	                Camera.main.fieldOfView +=2;
	            if (Camera.main.orthographicSize<=20)
	                                Camera.main.orthographicSize +=0.5;
	 
	        }
	    // ---------------Code for Zooming In------------------------
	     if (Input.GetAxis("Mouse ScrollWheel") > 0)
	        {
	            if (Camera.main.fieldOfView>2)
	                Camera.main.fieldOfView -=2;
	            if (Camera.main.orthographicSize>=1)
	                                Camera.main.orthographicSize -=0.5;
	        }
	       
	    // -------Code to switch camera between Perspective and Orthographic--------
	     if (Input.GetKeyUp(KeyCode.B ))
	    {
	        if (Camera.main.orthographic==true)
	            Camera.main.orthographic=false;
	        else
	            Camera.main.orthographic=true;
	    }
	}
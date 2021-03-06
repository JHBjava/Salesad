exports.definition = {
	config: {
		columns: {
		    "i_id": "INTEGER PRIMARY KEY",
		    "a_id": "INTEGER",
		    "price": "TEXT",
		    "barcode":  "INTEGER",
		    "description": "TEXT",
		    "voucher_description": "TEXT",
		    "caption": "TEXT",
		    "img_path": "TEXT",
		    "position": "INTEGER",
		    "status": "INTEGER",
		    "isExclusive": "INTEGER"		//1-exclusive, 2- normal
		},
		adapter: {
			type: "sql",
			collection_name: "items",
			idAttribute: "i_id"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
			addColumn : function( newFieldName, colSpec) {
				var collection = this;
				var db = Ti.Database.open(collection.config.adapter.db_name);
				if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
				var fieldExists = false;
				resultSet = db.execute('PRAGMA TABLE_INFO(' + collection.config.adapter.collection_name + ')');
				while (resultSet.isValidRow()) {
					if(resultSet.field(1)==newFieldName) {
						fieldExists = true;
					}
					resultSet.next();
				}  
			 	if(!fieldExists) { 
					db.execute('ALTER TABLE ' + collection.config.adapter.collection_name + ' ADD COLUMN '+newFieldName + ' ' + colSpec);
				}
				db.close();
			},
			getExclusiveByAid: function(a_id){
				var collection = this;
				var sql = "SELECT count(*) as total FROM " + collection.config.adapter.collection_name + " WHERE isExclusive = 1 AND a_id='"+ a_id+ "' group by a_id";
              // console.log(sql);
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
				}
                var res = db.execute(sql);
                var arr = []; 
                var total = 0;
                if (res.isValidRow()){
                 	total = res.fieldByName('total');
				} 
				 
				res.close();
                db.close();
                collection.trigger('sync');
                return total;
			},
			getItemByAds : function(a_id){
				var collection = this;
				var sql = "SELECT * FROM " + collection.config.adapter.collection_name + " WHERE a_id='"+ a_id+ "' order by position " ;
              // console.log(sql);
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
				}
                var res = db.execute(sql);
                var arr = []; 
                var count = 0;
                while (res.isValidRow()){
                 	var caption = res.fieldByName('caption');
                 	//console.log(caption);
                 	if(caption != "" && caption != null){
                 		caption = caption.replace(/&quot;/g,"'");
                 	} 
					arr[count] = {
						i_id: res.fieldByName('i_id'),
					    a_id: res.fieldByName('a_id'),
					    price: res.fieldByName('price'),
					    barcode: res.fieldByName('barcode'),
					    description: res.fieldByName("description"),
					    voucher_description: res.fieldByName("voucher_description"),
					    caption: caption,
					    isExclusive: res.fieldByName("isExclusive"),
					    img_path: res.fieldByName('img_path')
					};
					res.next();
					count++;
				} 
				 
				res.close();
                db.close();
                collection.trigger('sync');
                return arr;
			},
			saveItem : function(i_id,a_id,price,barcode, caption, img_path){
				
				var collection = this;
                var sql = "SELECT * FROM " + collection.config.adapter.collection_name + " WHERE i_id="+ i_id ;
                var sql_query =  "";
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
				}
                var res = db.execute(sql);  
                if(caption === null){
                	caption = "";
                }
                
                if(caption != ""){
                	caption = caption.replace(/["']/g, "&quot;");
                }
				
                if (res.isValidRow()){
             		sql_query = "UPDATE " + collection.config.adapter.collection_name + " SET a_id=?, price=?,barcode=?, caption=?, img_path=? WHERE i_id=?";
             		db.execute(sql_query, a_id, price,barcode, caption, img_path, i_id);
                }else{
                	sql_query = "INSERT INTO " + collection.config.adapter.collection_name + " (i_id,a_id,price,barcode,caption, img_path) VALUES (?,?,?,?,?,?)" ;
                	db.execute(sql_query, i_id, a_id, price,barcode, caption, img_path);
				}
				
	            db.close();
	            collection.trigger('sync');
			},
            saveArray : function(arr){
				var collection = this;
				
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
                db.execute("BEGIN");
                arr.forEach(function(entry) {
	                var sql_query =  "INSERT OR IGNORE INTO "+collection.config.adapter.collection_name+" (i_id, a_id, price,barcode,caption,img_path,position,status, description, voucher_description, isExclusive) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
					db.execute(sql_query, entry.i_id, entry.a_id, entry.price, entry.barcode, entry.caption, entry.img_path, entry.position, entry.status, entry.description, entry.voucher_description, entry.isExclusive);
					var sql_query = "UPDATE "+collection.config.adapter.collection_name+" SET a_id=?, price=?,barcode=?,caption=?,img_path=?,position=?,status=?, description=?, voucher_description=?, isExclusive=? WHERE i_id=?";
					db.execute(sql_query, entry.a_id, entry.price, entry.barcode, entry.caption, entry.img_path, entry.position, entry.status, entry.description, entry.voucher_description, entry.isExclusive, entry.i_id);
				});
				db.execute("COMMIT");
	            db.close();
	            collection.trigger('sync');
			},
			resetItem : function(a_id){
				var collection = this;
                var sql = "DELETE FROM " + collection.config.adapter.collection_name +" WHERE a_id="+ a_id;
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
				}
                db.execute(sql);
                db.close();
                collection.trigger('sync');
			},
		});

		return Collection;
	}
};
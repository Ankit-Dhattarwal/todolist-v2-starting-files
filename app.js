
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistDb", { useNewUrlParser: true, useUnifiedTopology: true });

// Here create the mongoose Schema 
const itemsSchema = {
  name: String
};

// Here create the mongoose modal
const Item = mongoose.model("Item", itemsSchema);

// monogoose document

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

// Array of documents
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



  app.get("/", function(req, res) {

    Item.find({}).then(foundItems => {

      if(foundItems.length === 0){
       // mongoose insertMany() ;
       Item.insertMany(defaultItems)
        .then(() => {
             console.log("Successfully save default items to DB");
          })
              .catch((error) => {
                     console.log(error);
    });
    res.redirect("/");
      }
      else{
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
      
    }).catch(error => {
      console.log(error);
    });
  });


  app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
  
    List.findOne({ name: customListName })
      .then(foundList => {
        if (!foundList) {
          // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          return list.save();
        } else {
          // Show existing list
          return foundList;
        }
      })
      .then(list => {
        res.render("list", { listTitle: list.name, newListItems: list.items });
      })
      .catch(error => {
        console.log(error);
      });
  });

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // create  document 
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(error => {
        console.log(error);
      });
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(error => {
        console.log(error);
      });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then( () => {
     console.log("Successfully remove the item.");
     res.redirect("/");
    })
    .catch( (error) => {
     console.log(error);
    });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

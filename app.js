//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose, { Schema } from "mongoose";
import _ from "lodash";
mongoose.connect(process.env.ADMIN);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Items", itemsSchema);

const item1 = new Item({
  name: "buy food"
});

const item2 = new Item({
  name: "Eat food"
});

const item3 = new Item({
  name: "buy more food"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  item: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req, res) {

  Item.find().then(function(data) {
  
    if(data.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: data});
    }

  });

});

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList){
      if(!foundList){
        //create new list
        const list = new List({
          name: customListName,
          item: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
        
      } else{
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.item});
      }
  })


  
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(foundList) {
      foundList.item.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  

});

app.post("/delete", function(req, res){
  const check = req.body.check;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: check}).then(res.redirect("/"));
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {item: {_id: check}}}).then(res.redirect("/" + listName));
  }


});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

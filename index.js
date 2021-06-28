const ical = require('node-ical');

const events = ical.sync.parseFile('PEWO.ics');
let days = [];
let courses = new Object();

//Sort events by days and by courses
for (const event of Object.values(events)) {
  //index of each day is unique. there are spaces in the array but they are removed later
  day = (event.start.getYear()*10000 + event.start.getMonth()*100+event.start.getDate());
  //if day does not exist create it
  if(days[day]==null){
    days[day]= new Object();
    days[day].date = new Date(event.start.getFullYear(),event.start.getMonth(),event.start.getDate());
    days[day].events = [];
  }
  //if course does not exist create it
  if(courses[event.summary] == null){
    courses[event.summary] = new Object();
    courses[event.summary].course = event.summary;
    courses[event.summary].events = [];
  }
  //events sorted by day are pushed into array of days
  days[day].events.push(event);
  //events sorted by course are pushed into the correct property
  courses[event.summary].events.push(event);
  
}

let conDays = [];
for (const day of days) {
  if(day != null){
    conDays.push(new DaySummary(day));
  }
}
let conCourses = [];
for (const course in courses) {
  conCourses.push(new CourseSummary(courses[course]));
}


let endOfLastDay = 0;
for (const day of conDays){
  let complaints = [];
  if ((day.startTime - endOfLastDay)<50400000)
    complaints.push("te late avond voor vroege ochtend");
  endOfLastDay = day.endTime;
  if (day.timeOnCampus > 36000000)
    complaints.push("te lange dag");
  for (move of day.moves){
    if (move.score == 1 && move.time < 3600000)
      complaints.push("onredelijke tijd tussen overschakeling on/off campus");
  }
  if (complaints.length != 0){
    console.log(day.date.toDateString());
    for ( const complaint of complaints )
      console.log(" - " + complaint);
    //for (const event of day.events)
      //console.log(event);
  }
}
conCourses.sort(function(a,b){
  return a.name.localeCompare(b.name);
});
for (const course of conCourses){
  console.log(course.name);
  console.log("lesTijd:  " + milisToHours(course.totalTime)+"u");
  console.log("onCampus: " + milisToHours(course.onCampusTime)+"u");
  console.log("offCampus:" + milisToHours(course.offCampusTime)+"u");
}

function milisToHours(milis){
  return milis / 3600000;
}

//console.log(conDays);
//console.log(conDays.length);
//console.log(courseSum);
//console.log(conCourses.length);


//constructor for object that contains usefull data about a day
function DaySummary(day) {
  this.date = day.date;
  this.timeBusy=0;
  this.timeOnCampus=0;
  this.locations = [];
  this.moves = [];
  this.lJump=0;
  day.events.sort(function(a,b){
    return a.start.getTime() - b.start.getTime();
  });
  this.events = day.events;
  this.startTime = this.events[0].start.getTime();
  this.endTime = this.events[0].end.getTime();
  let lastEvent = null;
  for(const event of this.events){
    if(event.start.getTime() <= this.startTime)
      this.startTime = event.start.getTime();
    if(event.end.getTime() >= this.endTime)
      this.endTime = event.end.getTime();
    this.timeBusy += event.end.getTime() - event.start.getTime();
    if(lastEvent != null){
      let jumpSize = event.start.getTime() - lastEvent.end.getTime();
      if(jumpSize >= this.lJump)
        this.lJump = jumpSize;
    }
    this.locations.push(event.location);
    let locationScore = 0;
    if (lastEvent != null){
      if (event.location != null && lastEvent.location != null){

        if (event.location.includes("OP_AFSTAND"))
          locationScore++;
        if (lastEvent.location.includes("OP_AFSTAND"))
          locationScore++;
      }


      let move = new Object();
      move.from = lastEvent.location;
      move.to = event.location
      move.time = event.start.getTime() - lastEvent.end.getTime();
      move.score = locationScore;
      this.moves.push(move);
    }
    lastEvent = event;

  }
  this.timeOnCampus = this.endTime - this.startTime;
}


function CourseSummary(course){
  this.name = course.course;
  this.totalTime = 0;
  this.onCampusTime = 0;
  this.offCampusTime = 0;
  this.events = course.events;
  for (event of this.events){
    let time = event.end.getTime()-event.start.getTime();
    this.totalTime += time
    if (event.location != null){
      if (event.location.includes("OP_AFSTAND"))
        this.offCampusTime += time;
      else
        this.onCampusTime += time;
    }
    else
      this.unKnownTime += time;
  }
  //console.log(this);

}







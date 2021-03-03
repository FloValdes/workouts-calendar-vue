<template>
  <v-row>
    <v-col>
      <v-sheet height="64">
        <v-toolbar
          flat
        >
          <v-btn
            color="primary"
            class="mr-4"
            @click="dialog = true"
          >
            New Event
          </v-btn>
          <v-btn
            outlined
            class="mr-4"
            color="grey darken-2"
            @click="setToday"
          >
            Today
          </v-btn>
          <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="prev"
          >
            <v-icon small>
              mdi-chevron-left
            </v-icon>
          </v-btn>
          <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="next"
            class="mr-4"
          >
            <v-icon small>
              mdi-chevron-right
            </v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">
            {{ $refs.calendar.title }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- <v-menu
            bottom
            right
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                outlined
                color="grey darken-2"
                v-bind="attrs"
                v-on="on"
              >
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right>
                  mdi-menu-down
                </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>Week</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Month</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu> -->
        </v-toolbar>
      </v-sheet>

      <!-- Add event dialog -->
      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-container>
            <v-form @submit.prevent="addEvent">
              <v-select v-model="workoutType" :items="workoutTypes" label="Workout Type"></v-select>
              <v-text-field v-if="workoutType == 'Fitness Blender' || workoutType == 'Youtube'" v-model="url" :rules="nameRules" type="text" label="URL"></v-text-field>
              <v-text-field v-if="workoutType == 'Custom'" v-model="name" :rules="nameRules" type="text" label="Workout Name"></v-text-field>
              <v-text-field v-if="workoutType == 'Custom' || workoutType == 'Youtube'" v-model="bodyFocus" type="text" label="Body Focus"></v-text-field>
              <v-text-field v-if="workoutType == 'Custom'" v-model="duration" type="number" label="Duration"></v-text-field>
              <v-text-field v-if="workoutType == 'Custom' || workoutType == 'Youtube'" v-model="difficulty" type="number" label="Difficulty" min="1" max="5"></v-text-field>
              <v-text-field v-if="workoutType == 'Custom' || workoutType == 'Youtube'" v-model="trainingType" type="text" label="Training Type"></v-text-field>
              <v-checkbox v-model="addHour" label="Add hour"></v-checkbox>
              <v-text-field v-if="addHour" v-model="start" :rules="startRules" type="datetime-local" label="Date" required></v-text-field>
              <v-text-field v-else v-model="start" :rules="startRules" type="date" label="Date" required></v-text-field>
              <v-btn type="submit" color="primary" class="mr-4" @click.stop="dialog=false">Create Event</v-btn>
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="primary"
          :events="events"
          :event-color="getEventColor"
          :type="type"
          :weekdays="weekday"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
        >
          <!-- <template v-slot:day-label="{ day }">
            {{day}} <span style="position: absolute; right: 0px; width: 15px; border: 1px solid #73AD21;">check</span>
          </template> -->
        </v-calendar>
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card
            color="grey lighten-4"
            min-width="350px"
            flat
          >
            <v-toolbar
              :color="selectedEvent.color"
              dark
            >
              <v-btn @click="deleteEvent(selectedEvent.id)" icon>
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">
                Body Focus: {{selectedEvent.bodyFocus}} <br>
                Duration: {{selectedEvent.duration}} <br>
                Difficulty: {{selectedEvent.difficulty}} <br>
                Training Type: {{selectedEvent.trainingType}}
              </form>
              <form v-else>
                <textarea-autosize v-model="selectedEvent.details" type="text" style="width: 100%" :min-height="100" placeholder="add notes">
                </textarea-autosize>
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                color="secondary"
                @click="selectedOpen = false"
              >
                Cancel
              </v-btn>
              <v-btn
                text
                v-if="currentlyEditing !== selectedEvent.id"
                @click.prevent="editEvent(selectedEvent)"
              >
                Edit
              </v-btn>
              <v-btn
                text
                v-else
                @click.prevent="updateEvent(selectedEvent)"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
  import { db } from '@/main';
  import axios from 'axios';
  import cheerio from 'cheerio';

  export default {
    props: ['events'],

    data: () => ({
      today: new Date().toISOString().substr(0, 10),
      focus: new Date().toISOString().substr(0, 10),
      type: 'month',
      typeToLabel: {
        month: 'Month',
        week: 'Week',
        day: 'Day',
        '4day': '4 Days',
      },
      name: null,
      bodyFocus: null,
      duration: null,
      difficulty: null,
      trainingType: null,
      start: null,
      url: null,
      color: "#1976D2",
      currentlyEditing: null,
      selectedEvent: {},
      selectedElement: null,
      selectedOpen: false,
      // events: [],
      dialog: false,
      weekday: [1, 2, 3, 4, 5, 6, 0],
      nameRules: [
        v => !!v || 'Name is required',
      ],
      startRules: [
        v => !!v || 'Date is required',
      ],
      addHour: false,
      workoutType: 'Fitness Blender',
      workoutTypes: ['Fitness Blender', 'Youtube', 'Custom']
    }),

    mounted () {
      // this.getEvents();
    },
    methods: {
      async getEvents() {
        let snapshot = await db.collection('calEvent').get();
        let events = [];
        snapshot.forEach(doc => {
          let appData = doc.data();
          appData.id = doc.id;
          events.push(appData);
        });
        // this.events = events;
        this.$emit('eventsChanged', events);
      },

      async addEvent() {
        if (this.start) {
          if (this.workoutType == "Fitness Blender") {
            const { data } = await axios.get(this.url);
            const $ =  cheerio.load(data);
            const details = $('.detail-value').toArray().map((x) => { return $(x).text()});
            this.bodyFocus = $('.focus.demi').text();
            this.duration = Number(details[0].split(' ')[0]);
            this.difficulty = details[2];
            this.trainingType = details[4];
            this.name = $('.heading.-large').text();
            this.color = '#16e0cf';
          } else if (this.workoutType == "Custom") {
            this.color = '#E68BF4';
          } else if (this.workoutType == "Youtube") {
            this.color = '#B9B02F';
            const videoId = this.url.split('=')[1];
            const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=AIzaSyBftGZlGOjzymXbxkHk2grqvChP7TcXcwY&part=snippet,contentDetails`);
            this.name = data.items[0].snippet.title;
            const duration = data.items[0].contentDetails.duration;
            if (duration.includes('H')) {
              console.log('error1');
              const hours = duration.split('T')[1].split('H')[0];
              console.log('error2');
              const minutes = duration.split('H')[1].split('M')[0];
              console.log('error3');
              this.duration = Number(hours) * 60 + Number(minutes);
            } else {
              console.log('a');
              this.duration = Number(duration.split('T')[1].split('M')[0]);
              console.log('b');
            }
          }

          await db.collection('calEvent').add({
            name: this.name,
            bodyFocus: this.bodyFocus,
            duration: this.duration,
            difficulty: this.difficulty,
            trainingType: this.trainingType,
            start: this.start,
            color: this.color
          });

          this.getEvents();
          this.name = null;
          this.url = null;
          this.bodyFocus = null;
          this.duration = null;
          this.start = null;
          this.end = null;
          this.color = "#1976D2";
        } else {
          alert('Date is required');
        }
      },

      async updateEvent(e) {
        await db.collection('calEvent').doc(this.currentlyEditing).update({
          details: e.details
        });
        this.selectedOpen = false;
        this.currentlyEditing = null;
      },

      async deleteEvent(e) {
        await db.collection('calEvent').doc(e).delete();
        this.selectedOpen = false;
        this.getEvents();
      },

      viewDay ({ date }) {
        this.start = date;
        this.dialog = true;
      },

      getEventColor (event) {
        return event.color;
      },

      setToday () {
        this.focus = '';
      },

      prev () {
        this.$refs.calendar.prev();
      },

      next () {
        this.$refs.calendar.next();
      },

      editEvent(e) {
        this.currentlyEditing = e.id;
      },

      showEvent ({ nativeEvent, event }) {
        const open = () => {
          this.selectedEvent = event;
          this.selectedElement = nativeEvent.target;
          setTimeout(() => {
            this.selectedOpen = true
          }, 10);
        }

        if (this.selectedOpen) {
          this.selectedOpen = false;
          setTimeout(open, 10)
        } else {
          open();
        }

        nativeEvent.stopPropagation();
      },
    },
  }
</script>
 

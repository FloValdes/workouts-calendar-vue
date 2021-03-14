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
              <v-select v-if="workoutType == 'Custom' || workoutType == 'Youtube'" v-model="bodyFocus" :items="bodyParts" :menu-props="{ maxHeight: '400' }" label="Body Focus" multiple ></v-select>
              <v-text-field v-if="workoutType == 'Custom'" v-model="duration" type="number" label="Duration"></v-text-field>
              <v-text-field v-if="workoutType == 'Custom' || workoutType == 'Youtube'" v-model="difficulty" type="number" label="Difficulty" min="1" max="5"></v-text-field>
              <v-select v-model="trainingType" @change="getSecondaryOptions" :items="trainingTypes" :menu-props="{ maxHeight: '400' }" label="Main Training Types" multiple ></v-select>              
              <v-select v-model="secondaryTrainingType" :items="currentSecondaryOptions" :menu-props="{ maxHeight: '400' }" label="Secondary Training Types" multiple ></v-select>              
              <v-checkbox v-model="addHour" label="Add hour"></v-checkbox>
              <v-text-field v-if="addHour" v-model="start" :rules="startRules" type="datetime-local" label="Date" required></v-text-field>
              <v-text-field v-else v-model="start" :rules="startRules" type="date" label="Date" required></v-text-field>
              <v-btn type="submit" color="primary" class="mr-4" @click.stop="dialog=false">Create Event</v-btn>
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-dialog v-model="signUpDialog" max-width="500">
        <v-card>
          <v-container>
            <div class='text-h4 mb-4'>Log In</div>
            <v-form @submit.prevent="signUp">
              <v-text-field v-model="email" label="Email"></v-text-field>
              <v-text-field v-model="password" label="Password" type='password'></v-text-field>
              <v-btn type="submit" color="primary" class="mr-4" @click.stop="signUpDialog=false">Log In</v-btn>
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
            min-width="400px"
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
              <v-btn v-if="selectedEvent.favorite === true" @click="changeFavoriteEvent" icon>
                <v-icon>mdi-heart-remove</v-icon>
              </v-btn>
              <v-btn v-else @click="changeFavoriteEvent" icon>
                <v-icon>mdi-heart-plus-outline</v-icon>
              </v-btn>
            </v-toolbar>
            <!-- <v-card-text> -->
              <v-container no-gutters v-if="currentlyEditing !== selectedEvent.id">
                <v-row no-gutters>
                  <v-col cols="7" style='font-size: 13px'>
                    <b>Body Focus:</b> {{selectedEvent.bodyFocus}} <br>
                    <b>Duration:</b> {{selectedEvent.duration}} <br>
                    <b>Difficulty:</b> {{selectedEvent.difficulty}} <br>
                    <b>Training Type:</b> {{selectedEvent.trainingType}}<br>
                    <b>Secondary Training Types:</b> {{selectedEvent.secondaryTrainingType}}
                  </v-col> 
                  <v-col cols='1'>
                    <v-divider
                    vertical
                    ></v-divider>
                  </v-col> 
                  <v-col cols="4" style='text-align: center'>
                    <b style='font-size: 13px'>Soreness and exhaustion:</b>
                    <v-rating
                      color="red"
                      background-color="grey"
                      empty-icon="mdi-fire"
                      full-icon="mdi-fire"
                      hover
                      length="3"
                      size="30"
                      v-model="selectedEvent.soreLevel"
                      style='text-align: center'
                      @input='ratingChange'
                    ></v-rating>
                  </v-col>
                </v-row>
              </v-container>
              <form v-else>
                <textarea-autosize v-model="selectedEvent.details" type="text" style="width: 100%" :min-height="100" placeholder="add notes">
                </textarea-autosize>
              </form>
            <!-- </v-card-text> -->
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
  import firebase from 'firebase';

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
      secondaryTrainingType: null,
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
      workoutTypes: ['Fitness Blender', 'Youtube', 'Custom'],
      bodyParts: ['Core', 'Lower Body', 'Total Body', 'Upper Body'],
      trainingTypes: ['Cardiovascular', 'Strength Training', 'Flexibility / Mobility'],
      secondaryTrainingTypes: {'Cardiovascular': ['Long Cardio', 'HIIT', 'Kickboxing'], 'Strength Training': ['High Reps Low Weights', 'Low Reps High Weights', 'Bodyweight'], 'Flexibility / Mobility': ['Yoga', 'Stretching', 'Pilates', 'Walking']},
      currentSecondaryOptions: [],
      signUpDialog: true,
      email: '',
      password: ''
    }),

    mounted () {
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
            this.difficulty = details[2][0];
            // this.trainingType = details[4];
            this.name = $('.heading.-large').text();
            this.color = '#16e0cf';
          } else if (this.workoutType == "Custom") {
            this.color = '#E68BF4';
            this.bodyFocus = this.bodyFocus.join(', ');
          } else if (this.workoutType == "Youtube") {
            this.color = '#B9B02F';
            this.bodyFocus = this.bodyFocus.join(', ');
            const videoId = this.url.split('=')[1];
            const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=AIzaSyBftGZlGOjzymXbxkHk2grqvChP7TcXcwY&part=snippet,contentDetails`);
            this.name = data.items[0].snippet.title;
            const duration = data.items[0].contentDetails.duration;
            if (duration.includes('H')) {
              const hours = duration.split('T')[1].split('H')[0];
              const minutes = duration.split('H')[1].split('M')[0];
              this.duration = Number(hours) * 60 + Number(minutes);
            } else {
              this.duration = Number(duration.split('T')[1].split('M')[0]);
            }
          }

          this.trainingType = this.trainingType.join(', ');
          this.secondaryTrainingType = this.secondaryTrainingType.join(', ');

          if (this.url) {
            await db.collection('calEvent').add({
              name: this.name,
              bodyFocus: this.bodyFocus,
              duration: this.duration,
              difficulty: this.difficulty,
              trainingType: this.trainingType,
              secondaryTrainingType: this.secondaryTrainingType,
              start: this.start,
              color: this.color,
              favorite: false,
              url: this.url,
            });
          } else {
            await db.collection('calEvent').add({
              name: this.name,
              bodyFocus: this.bodyFocus,
              duration: this.duration,
              difficulty: this.difficulty,
              trainingType: this.trainingType,
              secondaryTrainingType: this.secondaryTrainingType,
              start: this.start,
              color: this.color,
              favorite: false,
            });
          }

          this.getEvents();
          this.name = null;
          this.url = null;
          this.bodyFocus = null;
          this.duration = null;
          this.start = null;
          this.end = null;
          this.trainingType = null;
          this.secondaryTrainingType = null;
          this.color = "#1976D2";
        } else {
          alert('Date is required');
        }
      },

      async updateEvent(e) {
        await db.collection('calEvent').doc(this.currentlyEditing).update({
          details: e.details
        });
        this.currentlyEditing = null;
      },

      async changeFavoriteEvent() {
        await db.collection('calEvent').doc(this.selectedEvent.id).update({
          favorite: !this.selectedEvent.favorite
        });
        this.selectedEvent.favorite = !this.selectedEvent.favorite;
      },

      async ratingChange(newRating) {
        await db.collection('calEvent').doc(this.selectedEvent.id).update({
          soreLevel: newRating
        });
        this.selectedEvent.soreLevel = newRating;
      },

      async deleteEvent(e) {
        await db.collection('calEvent').doc(e).delete();
        this.selectedOpen = false;
        this.getEvents();
      },

      async signUp() {
        const auth = firebase.auth();
        const promise = auth.signInWithEmailAndPassword(this.email, this.password);
        promise.catch(e => alert(e.message));
      },

      getSecondaryOptions() {
        let sec = [];
        this.trainingType.forEach(primaryOption => sec = sec.concat(Object.values(this.secondaryTrainingTypes[primaryOption])));
        this.currentSecondaryOptions = sec;
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
 

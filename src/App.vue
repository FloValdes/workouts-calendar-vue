<template>
  <v-app>
    <v-main>
      <div class='parent-main'>
        <calendar class='calendar-main' :events="events" @eventsChanged="events = $event; getChartData()"></calendar>
        <div class='graph-main'>
          <div class='text-h3'>Totales</div>
          <bar-chart :chart-data="chartDataDifficulty" :options="options"></bar-chart>
          <bar-chart :chart-data="chartDataBodyPart" :options="options"></bar-chart>
          <bar-chart :chart-data="chartDataDuration" :options="options"></bar-chart>
        </div>
      </div>
      <v-container>
        <div class='text-h2 text-center'>Workouts</div>
        <v-text-field
          v-model="searchWorkoutTable"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
        <v-data-table
          :headers="workoutTableHeaders"
          :items="uniqueEvents"
          :items-per-page="15"
          class="elevation-1"
          :search="searchWorkoutTable"
        >>
          <template v-slot:[`item.favorite`]="{ item }">
            <v-chip
              :color="item.favorite ? 'green' : 'red'"
              dark
            >
              {{ item.favorite ? 'Yes' : 'No' }}
            </v-chip>
          </template>
          <template v-slot:[`item.soreLevel`]="{ item }">
            <v-chip
              :color="item.soreLevel < 1.7 ? 'yellow' : item.soreLevel < 2.4 ? 'orange' : item.soreLevel <= 3 ? 'red' : 'grey'"
              dark
            >
              {{ item.soreLevel ? item.soreLevel : '?' }}
            </v-chip>
          </template>
          <template v-slot:[`item.url`]="{ item }">
            <v-btn
              icon
              :href="item.url"
              v-if="item.url"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>
          </template>
        </v-data-table>      
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Calendar from './components/Calendar';
import BarChart from './components/BarChart';
import { db } from '@/main';

export default {
  name: 'App',

  components: {
    'calendar': Calendar,
    'bar-chart': BarChart
  },

  data: () => ({
    events: [],
    difficulties: ['1', '2', '3', '4', '5'],
    bodyParts: ['Core', 'Lower Body', 'Total Body', 'Upper Body'],
    durations: ['<15', '15-30', '30-45', '45-60', '60<'],
    chartDataDifficulty: {},
    chartDataBodyPart: {},
    chartDataDuration: {},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }]
        }
    },
    workoutTableHeaders: [
      {
        text: 'Workout',
        align: 'start',
        sortable: false,
        value: 'name',
      },
      { text: 'Body Focus', value: 'bodyFocus' },
      { text: 'Duration', value: 'duration' },
      { text: 'Difficulty', value: 'difficulty' },
      { text: 'Favorite', value: 'favorite' },
      { text: 'Soreness', value: 'soreLevel' },
      { text: 'Link', value: 'url' },
    ],
    searchWorkoutTable: ""
  }),

  computed: {
    uniqueEvents: function() {
      const uniqueNames = []
      this.events.forEach((event) => {
        if (uniqueNames.map(e => e.name).includes(event.name)) {
          const summaryEvent = uniqueNames.filter(e => e.name === event.name)[0];
          if (event.bodyFocus !== summaryEvent.bodyFocus) {
            if (event.bodyFocus.split(', ').length > summaryEvent.bodyFocus.split(', ').length) {
              summaryEvent.bodyFocus = event.bodyFocus;
            }
          }
          summaryEvent.duration += Number(event.duration);
          summaryEvent.difficulty += Number(event.difficulty);
          if (!summaryEvent.favorite && event.favorite) {
            summaryEvent.favorite = event.favorite;
          }
          if (event.soreLevel) {
            summaryEvent.soreLevel += Number(event.soreLevel);
            summaryEvent.soreCount += 1;
          }
          summaryEvent.count += 1;
        } else {
          uniqueNames.push({
            name: event.name,
            bodyFocus: event.bodyFocus,
            duration: Number(event.duration),
            difficulty: Number(event.difficulty),
            trainingType: event.trainingType,
            secondaryTrainingType: event.secondaryTrainingType,
            favorite: event.favorite,
            soreLevel: event.soreLevel ? Number(event.soreLevel) : 0,
            count: 1,
            soreCount: event.soreLevel ? 1 : 0,
            url: event.url
          });
        }
      });
      uniqueNames.map((e) => e.duration = e.duration / e.count)
      uniqueNames.map((e) => e.difficulty = e.difficulty / e.count)
      uniqueNames.map((e) => e.soreLevel = e.soreLevel / e.soreCount)
      return uniqueNames
    }
  },

  mounted () {
    this.loadData();
  },

  methods: {
    async loadData() {
      await this.getEvents();
      await this.getChartData();
    },

    async getEvents() {
      let snapshot = await db.collection('calEvent').get();
      let events = [];
      snapshot.forEach(doc => {
        let appData = doc.data();
        appData.id = doc.id;
        events.push(appData);
      });
      this.events = events;
    },

    async getChartData() {
      const diffCount = [];
      this.difficulties.forEach((diff) => {
        diffCount.push(this.events.filter(c => c.difficulty[0] === diff).length);
      })
      const newDataDifficulty = {
        labels: this.difficulties,
        datasets: [
          {
            label: 'Difficulty',
            backgroundColor: '#f87979',
            data: diffCount
          }
        ]
      } 

      const bodyCount = [];
      this.bodyParts.forEach((bodyPart) => {
        bodyCount.push(this.events.filter(c => c.bodyFocus.split(',').map((e) => e.trim()).indexOf(bodyPart) !== -1).length);
      })
      const newDataBodyPart = {
        labels: this.bodyParts,
        datasets: [
          {
            label: 'Body Part',
            backgroundColor: '#00B97C',
            data: bodyCount
          }
        ]
      }

      const binRange = {'<15': [-1, 15], '15-30': [15, 30], '30-45': [30, 45], '45-60': [45, 60], '60<': [60, Infinity]}
      const durationCount = [];
      this.durations.forEach((duration) => {
        durationCount.push(this.events.filter(c => c.duration >= binRange[duration][0] && c.duration < binRange[duration][1]).length)
      })
      const newDataDuration = {
        labels: this.durations,
        datasets: [
          {
            label: 'Duration',
            backgroundColor: '#A090FF',
            data: durationCount
          }
        ]
      }

      this.chartDataDifficulty = newDataDifficulty;
      this.chartDataBodyPart = newDataBodyPart;
      this.chartDataDuration = newDataDuration;
    }
  }
};
</script>

<style>
  .parent-main {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  .calendar-main {
    flex: 1 1 1000px;
    margin: 5px;
  }

  .graph-main {
    flex: 1 1 200px;
    margin: 5px;
    height: 95vh;
    text-align: center;
  }
</style>
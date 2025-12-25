import { title } from "process"
import ExploreBtn from "./components/ExploreBtn"
import EventCard from "./components/EventCard"
import { events } from "@/lib/constants"

const Home = () => {
  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev. <br /> Events you can't miss</h1>
      <p className="text-center mt-5">Hackathons, Meetups, and confrences, All in one place.</p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.map((event) => (
            <li className="list-none" key={event.title}>
              <EventCard {...event}
              />
            </li>
          )
          )}
        </ul>
      </div>
    </section>
  )
}

export default Home 
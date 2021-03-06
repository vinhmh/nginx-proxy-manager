import React, { Component } from 'react';
import css from '../App/App.scss';
import tcss from './Time.scss';
import { connect } from 'react-redux';
import { getDifferentTime, twoDigitFormatter } from '../../utilities/time';
import * as Sender from '../../socket/sender'
import currentUser from '../../middleware/app/currentUser';
let interpreterInterval = null;
class Timer extends Component {
  state = {
    distanceTimeStop: 0.0,
    timer: '00:00:00',
    isShowOptionTimer:false
  };

  interpreterInterval = null;

  componentDidUpdate(prevProps) {
    // this.checkIntepreterChanges(prevProps);
    const { members } = this.props
    const currentTechAssistant = members.find(m => m.user.meetingID == this.props.currentUser.meetingID && m.user.isTechAssistant && this.props.currentUser.startMeeting)
    if (prevProps.currentUser.startStopTime !== null &&
      this.props.currentUser.isStartTime &&
      !prevProps.currentUser.isStartTime &&
      !this.props.currentUser.isResetTime
    ) {
      this.setState({
        distanceTimeStop: this.state.distanceTimeStop + this.props.currentUser.endStopTime - prevProps.currentUser.startStopTime,
      })
    }
    if (!currentTechAssistant) return
    if (interpreterInterval !== null) clearInterval(interpreterInterval)
    interpreterInterval = setInterval(() => this.interpreterTimeConverter(), 1000)
  }

  componentWillUnmount() {
    if (interpreterInterval !== null) clearInterval(interpreterInterval)
  }

  interpreterTimeConverter = (prevProps) => {
    // const currentInterpreter = this.props.moderators.members.find(({ status }) => status === 'WORKING');
    // const lastInterpreter = prevProps.moderators.members.find(({ status }) => status === 'WORKING');

    // if (!currentInterpreter) return;
    // if (lastInterpreter) {
    //   if (lastInterpreter.userId === currentInterpreter.userId) return;
    // }

    // const lastInterpreterSessionTime = new Date();
    // if (this.interpreterInterval !== null) clearInterval(this.interpreterInterval);
    // this.interpreterInterval = setInterval(() => {
    //   const difference = getDifferentTime(lastInterpreterSessionTime, new Date(),0.0);
    //   const timer = `${twoDigitFormatter(difference.getHours())}:${twoDigitFormatter(
    //     difference.getMinutes(),
    //   )}:${twoDigitFormatter(difference.getSeconds())}`;
    //   this.setState({ timer });
    // }, 1000);
    if (this.props.currentUser.startStopTime) {
      return
    }
    if (this.props.currentUser.isResetTime) {
      let isStartTime = false
      let isResetTime = true
      let startMeeting = false
      this.handleUpdateAttributesTimeModerator(isStartTime, isResetTime, startMeeting)
      this.setState({
        distanceTimeStop: 0.0,
        timer: "00:00:00"
      })
      return
    }

    const startDate = this.props.currentUser.lastInterpreterSessionTime
    const distanceTimeStop = this.props.currentUser.distanceTimeStop
    if (startDate == null) {
      this.setState({
        timer: "00:00:00"
      })
      return
    }
    const endDate = new Date().getTime()
    const difference = getDifferentTime(startDate, endDate, distanceTimeStop)

    const hours = difference.getHours() < 10 ? `0${difference.getHours()}` : difference.getHours()
    const minutes = difference.getMinutes() < 10 ? `0${difference.getMinutes()}` : difference.getMinutes()
    const seconds = difference.getSeconds() < 10 ? `0${difference.getSeconds()}` : difference.getSeconds()
    this.setState({
      timer: this.state.timer = `${hours}:${minutes}:${seconds}`,
    })
  };

  handleUpdateAttributesTimeModerator(isStartTime, isResetTime, startMeeting) {
    const { currentUser, members } = this.props;
    members.map(m => {
      if (m.user.meetingID == currentUser.meetingID) {
        const msg = { id: m.id, isStartTime, isResetTime, startMeeting }
        Sender.startTimeModerator(msg)
      }
    })
  }

  handleEventTimeModerator(e) {
    let isStartTime = null
    let isResetTime = null
    let startMeeting = this.props.currentUser.startMeeting
    console.log("handle event")
    if (e == "start") {
      isStartTime = true
      isResetTime = false
      startMeeting = true
      console.log("start")
    }
    else if (e == "stop") {
      isStartTime = false
      isResetTime = false
    }
    else if (e == "reset") {
      isStartTime = false
      isResetTime = true
      this.setState({
        timer: "00:00:00"
      })
    }
    console.log(`IsReSetTimer:${isResetTime}, IsStartTimer:${isStartTime}, startMeeting:${startMeeting}`)
    this.handleUpdateAttributesTimeModerator(isStartTime, isResetTime, startMeeting)
  }
  
  render() {
    return (
      <>
        <span className={css.timeTitle} id="timer">
          Timer {this.props.currentUser.isModerator && this.props.currentUser.isResetTime ? "00:00:00" : this.state.timer}
        </span>
        {this.props.currentUser.isTechAssistant && <span style={{cursor:'pointer', paddingTop:6}} onClick={()=>this.setState({isShowOptionTimer:!this.state.isShowOptionTimer})}>
          <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-three-dots-vertical" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path  d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
          </svg>
        </span>}
        {
          this.props.currentUser.isTechAssistant && this.state.isShowOptionTimer?
            <div className={tcss.btnGroup}>
              <button onClick={() => {console.log("start event"),this.handleEventTimeModerator("start")}}>start</button>
              <button onClick={() => {console.log("stop event") ,this.handleEventTimeModerator("stop")}}>stop</button>
              <button onClick={() => this.handleEventTimeModerator("reset")}>reset</button>
            </div>
            :
            null
        }
      </>
    )
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.currentUser,
  members: state.members,
  moderators: state.moderators,
});

export default connect(mapStateToProps)(Timer);

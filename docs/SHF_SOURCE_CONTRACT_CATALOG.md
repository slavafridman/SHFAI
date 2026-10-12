# SHF Source Contract Catalog

Generated from readable local source and Struts XML. This is not a live schema export.
Regenerate with `./docs/Inspect-ShfDesign.ps1 -Mode Export`. No database or broker is contacted.

## 1. Complete Struts Route Catalog

Routes, parameters, form bindings, and forwards come from parsed XML. HTTP methods are not constrained by this catalog. A `.do` suffix is visible in application links and forwards; servlet mapping remains unverified.

| Legacy path | Owning action | Mapping parameters | Form / scope | Forwards |
| --- | --- | --- | --- | --- |
| `/mPlatform` | [bzq.shf.actions.MobileLoginAction](../SHF/src/bzq/shf/actions/MobileLoginAction.java) | `` | loginForm / request | loginSuccessful: /login.do |
| `/login` | [bzq.shf.actions.LoginAction](../SHF/src/bzq/shf/actions/LoginAction.java) | `` | loginForm / request | loginSuccessful: /jsp/shf_index.jsp; loginFail: /jsp/login_fail.jsp; obtainUserId: /jsp/shf_obtainUserId.jsp |
| `/msgBar` | org.apache.struts.actions.ForwardAction | `/jsp/message_bar.jsp` |  /  |  |
| `/loadTables` | [bzq.shf.actions.LoadTablesAction](../SHF/src/bzq/shf/actions/LoadTablesAction.java) | `` |  /  |  |
| `/message/messages_icon` | [bzq.shf.actions.MessagesAction](../SHF/src/bzq/shf/actions/MessagesAction.java) | `param=showMessages_icon , activity=aa` | messageForm /  | success: /jsp/showMessages_new_icon.jsp; fail: /jsp/shf_blank.jsp; not_agent: /jsp/not_employee_main.jsp |
| `/message/messages` | [bzq.shf.actions.MessagesAction](../SHF/src/bzq/shf/actions/MessagesAction.java) | `param=showMessages , activity=aa` | messageForm /  | success: /jsp/showMessages_new.jsp; fail: /jsp/shf_blank.jsp; not_agent: /jsp/not_employee_main.jsp |
| `/messages/deleteMessages` | [bzq.shf.actions.MessagesAction](../SHF/src/bzq/shf/actions/MessagesAction.java) | `param=deleteMessages , activity=aa` | messageForm /  | success: /message/messages.do |
| `/messages/acceptOffer` | [bzq.shf.actions.MessagesAction](../SHF/src/bzq/shf/actions/MessagesAction.java) | `param=acceptOffer , activity=aa` | messageForm /  | success: /message/messages.do |
| `/employee/searchParam` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=list_param , activity=card_main` | employeeSearchForm / request | success: /employee/searchResult.do; success_agent: /jsp/employee_card.jsp; fail: /jsp/shf_blank.jsp |
| `/employee/updateParamSMS` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=updateSMS , activity=card_main` | employeeDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/employee/showCard` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=card , activity=card_view` | employeeDataForm / request | success: /jsp/employee_card.jsp; fail: /jsp/shf_blank.jsp |
| `/employee/searchResult` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=list_result , activity=card_search` | employeeSearchForm / request | success: /jsp/employee_list.jsp; fail: /jsp/shf_blank.jsp |
| `/employee/getSkills` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=skills , activity=card_skills` | employeeDataForm / request | success: /jsp/employeeCard/emp_skills.jsp |
| `/employee/getShifts` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=shifts_results , activity=card_activities` | employeeActivitiesForm / request | success: /jsp/employeeCard/employee_shifts.jsp |
| `/employee/getCourses` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=courses , activity=card_courses` | employeeDataForm / request | success: /jsp/employeeCard/emp_courses.jsp |
| `/employee/getTaxiOrders` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=taxi , activity=card_taxi_orders` | employeeDataForm / request | success: /jsp/employeeCard/emp_monit_orders.jsp |
| `/employee/getEvents` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=events , activity=card_events_view` | employeeDataForm / request | success: /jsp/employeeCard/emp_events.jsp |
| `/employee/getEducation` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=education , activity=card_education` | employeeDataForm / request | success: /jsp/employeeCard/employee_education.jsp |
| `/employee/getDays` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=activities_param , activity=card_activities` | employeeActivitiesForm / request | success: /jsp/employeeCard/employee_activities.jsp |
| `/employee/addEvent` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=add_event , activity=card_events_view` | addEventForm / request | success: /employee/getEvents.do; fail: /employee/getEvents.do |
| `/employee/searchForInforce` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=inforce_result , activity=shift_inforce_addshift` | employeeInforceForm / request | success: /jsp/shift_inforce_employee_list.jsp |
| `/employee/cancelEvent` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=event_cancel , activity=card_events_cancel` | eventForm / request | success: /employee/getEvents.do |
| `/employee/getShiftsParam` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=shifts_param , activity=aa` | employeeActivitiesForm / request | success: /employee/getShifts.do |
| `/employee/getExceptions` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=exceptions , activity=card_view_exceptions` | employeeActivitiesForm / request | success: /jsp/employeeCard/employee_exceptions.jsp |
| `/employee/getTeamMembers` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=team_members , activity=aa` | employeeSearchForm / request | success: /jsp/set_emps.jsp |
| `/employee/getShiftsForSwitch` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=shifts_switch , activity=aa` | employeeActivitiesForm / request | success: /jsp/shifts_for_switch.jsp |
| `/attendance/param` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=param , activity=attend_menu` | employeeArriveForm / request | goto_agent: /attendance/agentParam.do; fail: /jsp/shf_blank.jsp; goto_search: /attendance/searchParam.do |
| `/attendance/searchResult` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=result , activity=attend_search` | employeeArriveForm / request | success: /jsp/attendance.jsp; fail: /jsp/shf_blank.jsp |
| `/attendance/employeeArrive` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=station , activity=attend_reg_station` | attendanceDataForm / request | success: /jsp/employee_arrive_stage.jsp; late: /jsp/late_popup.jsp |
| `/attendance/setAttendance` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=stage , activity=attend_reg_stage` | employeeArriveForm / request | late: /jsp/late_popup.jsp; report: /jsp/report_popup.jsp |
| `/attendance/addEvent` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=add_event , activity=attend_add_missing` | employeeArriveForm / request | success: /jsp/attendance.jsp |
| `/attendance/employeeArriveStation` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=station_agent , activity=attend_reg_station` | employeeArriveForm / request | success: /attendance/agentParam.do |
| `/attendance/employeeExit` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=exit , activity=attend_exit_station` | employeeArriveForm / request | fail: /jsp/shf_blank.jsp |
| `/attendance/addFlag` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=flag , activity=attend_flags` | attendanceDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/attendance/cancelExit` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=cancel_exit , activity=attend_cancel_exit` | attendanceDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/attendance/removeFlag` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=cancel_flag , activity=attend_flags` | attendanceDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/attendance/viewLate` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=viewLate , activity=attend_reg_station` | attendanceDataForm / request | success: /jsp/late_popup.jsp |
| `/attendance/viewMissing` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=viewMissing , activity=attend_add_missing` | attendanceDataForm / request | success: /jsp/missing_popup.jsp |
| `/attendance/searchParam` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=param_search , activity=attend_search` | employeeArriveForm / request | success: /attendance/searchResult.do; fail: /jsp/shf_blank.jsp |
| `/attendance/agentParam` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=param_agent , activity=attend_agent` | employeeArriveForm / request | success: /jsp/employee_arrive.jsp; fail: /jsp/shf_blank.jsp; fail_locked: /jsp/employee_locked.jsp |
| `/attendance/employeeStationExit` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=agent_exit , activity=attend_exit_station` | employeeArriveForm / request | success: /attendance/agentParam.do; earlyExit: /jsp/employee_earlyExit.jsp |
| `/attendance/cancelStation` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=cancel_station , activity=attend_cancel_station` | attendanceDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/admin` | [bzq.shf.actions.AdminAction](../SHF/src/bzq/shf/actions/AdminAction.java) | `param=admin_main , activity=admin_menu` | eventReason / request | showEventReason: /jsp/eventReason.jsp; updatedeleteEventReason: /jsp/eventReasonUpdateDelete.jsp; updateSkills: /jsp/update_skills.jsp; showEventType: /jsp/event_types.jsp; updatedeleteEventType: /jsp/event_update_delete.jsp; mainAdmin: /jsp/admin_main.jsp; viewCompletionsTypes: /jsp/admin/view_completions_types.jsp |
| `/admin/viewMokedParameters` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=view_moked , activity=admin_param_view` | adminForm / request | success: /jsp/system_parameters.jsp |
| `/admin/saveParameters` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=save , activity=admin_param_update` | adminForm / request | success: /jsp/system_parameters.jsp |
| `/admin/viewEmployeeParameters` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=view_employee , activity=admin_emparam_view` | employeeDataForm / request | success: /jsp/employee_parameters.jsp |
| `/admin/saveEmployeeParameters` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=update_employee , activity=admin_emparam_update` | employeeDataForm / request | success: /jsp/employee_parameters.jsp |
| `/admin/updateSkillParam` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=updateSkillParam , activity=admin_skill_view` | skillForm / request | success: /jsp/update_skill_param.jsp |
| `/admin/updateSkillSave` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=updateSkillSave , activity=admin_skill_update` | skillForm / request |  |
| `/shift/shiftMenu` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=menu , activity=shift_menu` | shiftDataForm / request | success_agent: /shift/myShiftParam.do; success_manager: /shift/searchParam.do |
| `/shift/searchParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=param , activity=shift_search` | shiftDataForm / request | success: /shift/searchResult.do |
| `/shift/addFromFile` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=addFromFile , activity=shift_search` | shiftDataForm / request | selectFile: /jsp/shift_addFromFile.jsp |
| `/shift/searchResult` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=result , activity=shift_search` | shiftDataForm / request | success: /jsp/shifts_search_list.jsp |
| `/shift/currentResult` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=current_result , activity=shift_current` | shiftDataForm / request | success: /jsp/shifts_list.jsp |
| `/shift/currentParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=current_param , activity=shift_current` | shiftDataForm / request | success: /shift/currentResult.do |
| `/shift/myShiftParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=my_param , activity=shift_myshifts` | shiftDataForm / request | success: /shift/myShiftResult.do |
| `/shift/myShiftResult` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=my_result , activity=shift_myshifts` | shiftDataForm / request | success: /jsp/shifts_my_shifts_list.jsp |
| `/shift/inforceShift` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=inforce_request , activity=shift_inforce_view` | shiftInforceForm / request | success: /jsp/shift_inforce.jsp; success_update: /jsp/shift_add_inforce_new.jsp; fail: /jsp/shift_add_inforce_new.jsp |
| `/shift/selectForUpdateShift` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=update_param , activity=shift_update` | shiftDataForm / request | success: /jsp/shift_change.jsp; fail: /jsp/shift_change.jsp |
| `/shift/inforceSearchOptionals` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=search_add_options , activity=shift_inforce_agent` | shiftInforceForm / request | success: /jsp/shift_inforce_options.jsp |
| `/shift/addShift` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=add_shift_request , activity=shift_inforce_addshift` | addShiftRequestForm / request | success: /shift/myShiftParam.do; fail: /jsp/shift_inforce_options.jsp; success_add: /shift/inforceShift.do?mode=populate; fail_add: /shift/inforceShift.do?mode=populate |
| `/shift/updateShiftExceptions` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=upsert_shift_check_exceptions, activity=shift_update` | shiftDataForm / request | success: /jsp/shift_change.jsp; fail: /shift/updateShift.do; exception_confirmed: /shift/updateShift.do |
| `/shift/updateShiftLocation` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=updateShiftLocation, activity=shift_update` | shiftDataForm / request | success: /shift/selectForUpdateShift.do |
| `/shift/updateShift` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=upsert_shift, activity=shift_update` | shiftDataForm / request | success: /shift/selectForUpdateShift.do; fail: /shift/selectForUpdateShift.do |
| `/shift/addInforceReqParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=add_inforce_param , activity=shift_inforce_update` | shiftInforceForm / request | success: /jsp/shift_add_inforce_new.jsp |
| `/shift/shiftCancelRemarkDialog` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=shift_cancel_remark , activity=shift_cancel` | shiftDataForm / request | success: /jsp/cancel_shift_popup.jsp |
| `/shift/checkPoolExtensionAllocated` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=checkPoolExtensionAllocated , activity=aa` | shiftDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/shift/poolExtAllocRelease` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=poolExtAllocRelease , activity=aa` | shiftDataForm / request | success: /jsp/poolExtAllocRelease.jsp |
| `/replace/switchPotential` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=showSwitchPotential , activity=replace_main` | replaceForm / request | showSwitchPotential: /jsp/switchPotential.jsp; userNotAllowedReplace: /shift/shiftMenu.do; switchPotentialSendRequests: /replace/switchPotentialSendRequests.do |
| `/replace/switchPotentialSendRequests` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=SwitchPotentialSendRequests , activity=replace_main` | replaceForm / request | success: /shift/shiftMenu.do; manageReplace: /replace/manageReplace.do |
| `/replace/searchForCandidate` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=searchForCandidate , activity=replace_main` | replaceForm / request | showCandidates: /jsp/showReplaceCandidate.jsp; manageReplace: /replace/manageReplace.do; getSwitchPotential: /replace/switchPotential.do |
| `/replace/insertShiftToRepository` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=insertShiftToRepository , activity=replace_main` | replaceForm / request | manageReplace: /replace/manageReplace.do |
| `/replace/offerReplace` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=offerReplaceToCandidate , activity=replace_main` | replaceForm /  | manageReplace: /replace/manageReplace.do |
| `/replace/cancelOffer` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=cancelUnCommitedOffer , activity=replace_main` | replaceForm /  | manageReplace: /replace/manageReplace.do |
| `/replace/manageReplace` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=showManageReplace , activity=replace_main` | offerReplaceForm /  | manageReplaceMokdan: /replace/manageReplaceMokdan.do; manageReplaceAdmin: /replace/manageReplaceAdmin.do |
| `/replace/cancelShiftReplace` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=cancelUnCommitedShiftReplace , activity=replace_main` | replaceForm /  | manageReplace: /replace/manageReplace.do |
| `/replace/lookForOffers` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=lookForOffers , activity=replace_main` | replaceForm /  | success: /jsp/showReplaceOffers.jsp |
| `/replace/rejectOffer` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=rejectReplaceOffer , activity=replace_main` | offerReplaceForm /  | success: /replace/lookForOffers.do; manageReplace: /replace/manageReplace.do |
| `/replace/acceptOffer` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=acceptReplaceOffer , activity=replace_main` | offerReplaceForm /  | success: /message/messages.do; fail: /replace/manageReplace.do |
| `/replace/manageReplaceAdmin` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=showManageReplaceAdmin , activity=replace_admin` | offerReplaceForm /  | success: /jsp/showManageReplace.jsp |
| `/replace/manageReplaceMokdan` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=showManageReplaceMokdan , activity=replace_agent` | offerReplaceForm /  | success: /jsp/showManageReplace.jsp |
| `/replace/checkForChangeShift` | [bzq.shf.actions.ReplaceAction](../SHF/src/bzq/shf/actions/ReplaceAction.java) | `param=checkShiftReplace , activity=aa` | replaceForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/break/searchParam` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=search_param , activity=break_menu` | breakForm / request | success: /break/searchResult.do |
| `/break/searchResult` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=search_result , activity=aa` | breakForm / request | success: /jsp/break_search_list.jsp |
| `/break/breakForShift` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=break_shift , activity=aa` | breakBeanForm / request | success: /jsp/shift_my_breaks.jsp |
| `/break/exitToBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=exit_to_break , activity=aa` | breakBeanForm / request | success: /attendance/agentParam.do |
| `/break/backFromBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=back_from_break , activity=aa` | breakBeanForm / request | success: /attendance/agentParam.do |
| `/break/goForChangeBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=change_break , activity=aa` | breakBeanForm / request | success: /jsp/showReplaceBreakCandidate.jsp; fail: /shift/myShiftParam.do |
| `/break/checkForChangeBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=check_break , activity=aa` | breakBeanForm / request | success: /jsp/showReplaceBreakCandidate.jsp; fail: /jsp/break_empty.jsp |
| `/break/insertBreakToCandidate` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=insert_break , activity=aa` | breakBeanForm / request | success: /shift/shiftMenu.do |
| `/break/offerReplaceBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=ask_replace_break , activity=aa` | breakCandidateBeanForm / request | successNew: /shift/shiftMenu.do; successExist: /break/showManageBreak.do |
| `/break/showManageBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=manage_break , activity=aa` | breakCandidateBeanForm / request | success: /jsp/showManageReplaceBreak.jsp |
| `/break/cancelBreakOffer` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=cancel_break_offer , activity=aa` | breakCandidateBeanForm / request | success: /break/showManageBreak.do |
| `/break/cancelBreakCandidate` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=cancel_break_cand , activity=aa` | breakCandidateBeanForm / request | success: /break/showManageBreak.do |
| `/break/lookForBreakOffer` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=select_offer , activity=aa` | breakCandidateBeanForm / request | success: /jsp/showReplaceBreakOffers.jsp |
| `/break/acceptBreakOffer` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=accept_break_offer , activity=aa` | breakCandidateBeanForm / request | success: /break/showManageBreak.do |
| `/break/rejectBreakOffer` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=reject_break_offer , activity=aa` | breakCandidateBeanForm / request | success: /break/showManageBreak.do |
| `/break/updateShiftBreak` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=update_shift_break , activity=aa` | shiftBreakForm / request | success: /shift/selectForUpdateShift.do |
| `/forecast/callsParam` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=call_param , activity=forecast_data` | forecastForm / request | success: /jsp/forecast_calls.jsp |
| `/forecast/callsResult` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=call_populate , activity=forecast_data` | forecastForm / request | success: /jsp/forecast_calls.jsp |
| `/forecast/schParam` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=sch_param , activity=forecast_data` | forecastForm / request | success: /jsp/forecast_sch.jsp |
| `/forecast/schResult` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=sch_populate , activity=forecast_data` | forecastForm / request | success: /jsp/forecast_sch.jsp |
| `/forecast/param` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=param , activity=forecast_data` | forecastForm / request | success: /jsp/forecast.jsp |
| `/switch/forceSwitch` | [bzq.shf.actions.SwitchAction](../SHF/src/bzq/shf/actions/SwitchAction.java) | `param=switch_shifts , activity=aa` | switchForm / request | removedLimit: /switch/forceSwitch.do; success: /shift/searchResult.do; fail: /jsp/goBack.jsp |
| `/switch/usrCancelForcedSwitch` | [bzq.shf.actions.SwitchAction](../SHF/src/bzq/shf/actions/SwitchAction.java) | `param=usrCancelForcedSwitch , activity=aa` | switchForm / request | success: /shift/shiftMenu.do; fail: /jsp/goBack.jsp |
| `/switch/check` | [bzq.shf.actions.SwitchAction](../SHF/src/bzq/shf/actions/SwitchAction.java) | `param=check , activity=aa` | switchForm / request | confirm: /jsp/replace_shift.jsp; success: /switch/forceSwitch.do; fail: /jsp/goBack.jsp |
| `/switch/sec_shift` | [bzq.shf.actions.SwitchAction](../SHF/src/bzq/shf/actions/SwitchAction.java) | `param=sec_shift , activity=aa` | shiftDataForm / request | success: /jsp/replace_shift.jsp; fail: /jsp/goBack.jsp |
| `/exception/cancel` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=cancel_exception , activity=exception_cancel` | employeeExceptionForm / request | success: /employee/getExceptions.do; fail: /employee/getExceptions.do |
| `/shift/addShiftTimeChangeParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=addShiftTimeChangeParam , activity=addShiftTimeChange` | shiftChangeRequestForm / request | success: /jsp/shift_time_change_form.jsp |
| `/shift/addUpdateShiftTimeChange` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=addUpdateChangeRequest , activity=addShiftTimeChange` | shiftChangeRequestForm / request | success: /shift/viewShiftTimeChangeRequests.do; fail: /jsp/shift_time_change_form.jsp |
| `/shift/viewShiftTimeChangeRequests` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=viewShiftTimeChangeRequests , activity=viewShiftTimeChange` | shiftChangeRequestForm / request | success: /jsp/shift_time_change_requests.jsp |
| `/shift/updateShiftTimeChangeParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=updateShiftTimeChangeParam , activity=addShiftTimeChange` | shiftChangeRequestForm / request | success: /jsp/shift_time_change_form.jsp; fail: /shift/viewShiftTimeChangeRequests.do |
| `/shift/viewChangeRequestApplications` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=requestApplications , activity=addShiftTimeChange` | shiftChangeRequestForm / request | success: /jsp/change_request_applications.jsp |
| `/shift/viewChangeRequestOptions` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=requestOptions , activity=addShiftTimeChange` | shiftChangeRequestForm / request | success: /jsp/change_request_options.jsp |
| `/shift/viewAgentChangeRequests` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=agentRequests , activity=agentShiftTimeChange` | shiftChangeRequestForm / request | success: /jsp/agent_change_requests.jsp; fail: /shift/myShiftParam.do |
| `/shift/confirmChangeRequest` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=confirmChangeRegister , activity=aa` | changeRequestCandidate / request | success: /shift/viewChangeRequestApplications.do; fail: /shift/viewShiftTimeChangeRequests.do; full: /jsp/shift_change_request_full.jsp |
| `/reduce/searchForReduce` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=reduce_result , activity=reduce_update` | reduceShiftReqtForm / request | success: /jsp/reduce_shift_list.jsp |
| `/reduce/reduceShiftReqOptions` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=reduce_result_option , activity=reduce_agent` | reduceShiftReqtForm / request | success: /jsp/reduce_shift_options.jsp |
| `/reduce/reduceShiftReq` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=reduce_request , activity=reduce_view` | reduceShiftReqtForm / request | success: /jsp/reduce_shift.jsp |
| `/reduce/reduceShift` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=add_reduce , activity=reduce_agent_update` | reduceShiftListForm / request | success_shift: /reduce/reduceShiftReq.do; success_option: /reduce/reduceShiftReqOptions.do |
| `/reduce/approveDeclineReduce` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=approve_decline , activity=reduce_update` | reduceShiftListForm / request | success: /reduce/reduceShiftReq.do; fail: /jsp/reduce_shift.jsp |
| `/reduce/declineAll` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=decline_all , activity=reduce_update` | reduceShiftReqtForm / request | success: /reduce/reduceShiftReq.do |
| `/reduce/addUpdateReduceShiftReq` | [bzq.shf.actions.ReduceDataAction](../SHF/src/bzq/shf/actions/ReduceDataAction.java) | `param=add_update_reduce , activity=reduce_update` | reduceShiftReqtForm / request | success: /jsp/reduce_add_reduce.jsp; successReturn: /reduce/reduceShiftReq.do; fail: /jsp/reduce_add_reduce.jsp |
| `/shift/rejectChangeCandidate` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=rejectChangeCandidate , activity=addShiftTimeChange` | changeRequestCandidate / request | success: /shift/viewChangeRequestApplications.do |
| `/shift/registerToChangeRequest` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=registerToChangeRequest , activity=agentShiftTimeChange` | changeRequestCandidate / request | success: /shift/viewAgentChangeRequests.do; fail: /shift/viewAgentChangeRequests.do |
| `/shift/shiftChangeRejectAll` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=shiftChangeRejectAll , activity=shiftChangeReject` | shiftChangeRequestForm / request | success: /shift/viewShiftTimeChangeRequests.do; fail: /shift/viewShiftTimeChangeRequests.do |
| `/attendance/approveReport` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=approve_report , activity=aa` | attendanceDataForm / request |  |
| `/attendance/cancelReport` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=cancel_report , activity=aa` | attendanceDataForm / request |  |
| `/attendance/employeeEarlyExit` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=EarlyExit , activity=aa` | addEventForm / request | success: /attendance/agentParam.do |
| `/shift/deleteFromRepositories` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=deleteFromRepositories , activity=deleteFromRepositories` | shiftDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/attendance/setTadreech` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=setTadreech , activity=attend_reg_stage` | employeeArriveForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/completion/addParam` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=param , activity=login_menu` | ctiCompletionForm / request | success: /jsp/cti.jsp; fail: /jsp/cti.jsp |
| `/completion/result` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=result , activity=login_menu` | ctiCompletionForm / request | success: /jsp/cti_completion_result.jsp; fail: /jsp/cti.jsp |
| `/completion/setCompletion` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=setCompletion` | ctiCompletionForm / request | success: /jsp/cti_set_completion.jsp; fail: /jsp/cti_completion_result.jsp |
| `/completion/saveCompletion` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=saveCompletion` | ctiCompletionForm / request | success: /jsp/cti_completion_finish.jsp; fail: /jsp/cti_set_completion.jsp |
| `/completion/menu` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=menu , activity=login_menu` | ctiCompletionForm / request | success: /jsp/cti_main.jsp; fail: /jsp/cti_main.jsp |
| `/completion/viewParam` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=view_param , ativity=login_view_completion` | ctiSearchCompletionForm / request | success: /jsp/cti_view_param.jsp; fail: /jsp/cti_view_param.jsp |
| `/completion/searchResult` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=view_result , ativity=login_view_completion` | ctiSearchCompletionForm / request | success: /jsp/cti_view_param.jsp; fail: /jsp/cti_view_param.jsp; successExcell: /completion/export.do |
| `/completion/export` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=export , activity=completion_export` | ctiSearchCompletionForm / request |  |
| `/completion/cancel` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=cancel , activity=completion_cancel` | ctiSearchCompletionForm / request | success: /jsp/cti_validate_cancel.jsp; fail: /completion/searchResult.do |
| `/completion/confirmCancel` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=confirm_cancel , activity=completion_cancel` | ctiSearchCompletionForm / request | success: /completion/searchResult.do; fail: /completion/searchResult.do |
| `/completion/update` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=update , activity=completion_update` | ctiSearchCompletionForm / request | success: /jsp/cti_set_completion_forupdate.jsp; fail: /completion/searchResult.do |
| `/completion/confirmUpdate` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=confirm_update , activity=completion_update` | ctiSearchCompletionForm / request | success: /jsp/cti_completion_finish.jsp; fail: /jsp/cti_completion_finish.jsp |
| `/cti/viewJobsToSap` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=view_job_sap , activity=login_assign_jobtosap` |  /  | success: /jsp/cti_job_to_sap.jsp |
| `/cti/assignJobToSap` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=assign_job_sap , activity=login_assign_jobtosap` | tableForm / request | success: /cti/viewJobsToSap.do |
| `/cti/unAssignJobToSap` | [bzq.shf.actions.CTIAction](../SHF/src/bzq/shf/actions/CTIAction.java) | `param=unassign_job_sap , activity=login_assign_jobtosap` | tableForm / request | success: /cti/viewJobsToSap.do |
| `/shift/viewRemarkDialog` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=showRemarkDialog` | shiftDataForm / request | success: /jsp/add_remark_dialog.jsp |
| `/shift/addRemark` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=addRemark` | shiftDataForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/admin/manageInnerJobs` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=manage_innerJobs` | innerJobForm / request | successView: /jsp/admin/manage_inner_jobs.jsp; successAdd: /admin/manageInnerJobs.do?action=view; successViewUpdate: /jsp/admin/update_inner_job.jsp; successGroups: /jsp/admin/inner_job_groups.jsp |
| `/admin/manageBuildings` | [bzq.shf.actions.ManageBuildingsAction](../SHF/src/bzq/shf/actions/ManageBuildingsAction.java) | `param=manage_buildings` | buildingForm / request | successView: /jsp/admin/manage_buildings.jsp; successUpdate: /admin/manageBuildings.do?action=view; successViewUpdate: /jsp/admin/update_building.jsp |
| `/admin/optShfSpView` | [bzq.shf.actions.OptShfSpAction](../SHF/src/bzq/shf/actions/OptShfSpAction.java) | `param=view` | optShfSpForm / request | successView: /jsp/opt_shf_sp.jsp |
| `/admin/optShfSpUpdate` | [bzq.shf.actions.OptShfSpAction](../SHF/src/bzq/shf/actions/OptShfSpAction.java) | `param=update` | optShfSpForm / request | successUpdate: /admin/optShfSpView.do |
| `/sp/break/timeActual` | [bzq.shf.actions.SoftPhoneAction](../SHF/src/bzq/shf/actions/SoftPhoneAction.java) | `param=timeActual` | SoftPhoneForm / request |  |
| `/sp/logout` | [bzq.shf.actions.SoftPhoneAction](../SHF/src/bzq/shf/actions/SoftPhoneAction.java) | `param=logout` | SoftPhoneForm / request |  |
| `/shift/viewOriginalShiftDialog` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=getShift` | shiftDataForm / request | success: /jsp/show_original_shift_popup.jsp |
| `/shift/viewOriginalShiftDialog` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=getShift` | shiftDataForm / request | success: /jsp/show_original_shift_popup.jsp |
| `/shift/export` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=export` | shiftDataForm / request |  |
| `/attendance/export` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=export` | employeeArriveForm / request |  |
| `/employee/export` | [bzq.shf.actions.EmployeeDataAction](../SHF/src/bzq/shf/actions/EmployeeDataAction.java) | `param=export` | employeeSearchForm / request |  |
| `/break/export` | [bzq.shf.actions.BreakDataAction](../SHF/src/bzq/shf/actions/BreakDataAction.java) | `param=export` | breakForm / request |  |
| `/shift/currentExport` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=currentExport` | shiftDataForm / request |  |
| `/attendance/removeMissing` | [bzq.shf.actions.AttendanceDataAction](../SHF/src/bzq/shf/actions/AttendanceDataAction.java) | `param=removeMissing` | employeeArriveForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/exceptions/param` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=param` | exceptionSearchForm / request | success: /exceptions/result.do |
| `/exceptions/result` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=result` | exceptionSearchForm / request | success: /jsp/exception_list.jsp |
| `/shift/exportMyShifts` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=exportMyShifts` | shiftDataForm / request |  |
| `/shift/exportInforce` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=exportInforce` | shiftInforceForm / request |  |
| `/exceptions/export` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=export` | exceptionSearchForm / request |  |
| `/shift/cancelledResult` | [bzq.shf.actions.ShiftCancelledAction](../SHF/src/bzq/shf/actions/ShiftCancelledAction.java) | `param=result` | shiftCancelledForm / request | success: /jsp/shift_activity_cancelled.jsp |
| `/shift/cancelledParam` | [bzq.shf.actions.ShiftCancelledAction](../SHF/src/bzq/shf/actions/ShiftCancelledAction.java) | `param=param` | shiftCancelledForm / request | success: /jsp/shift_activity_cancelled.jsp |
| `/shift/cancelledExport` | [bzq.shf.actions.ShiftCancelledAction](../SHF/src/bzq/shf/actions/ShiftCancelledAction.java) | `param=export` | shiftCancelledForm / request |  |
| `/exceptions/viewRemarkDialog` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=showRemarkDialog` | employeeExceptionForm / request | success: /jsp/add_exception_remark_dialog.jsp |
| `/exceptions/addRemark` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=addRemark` | employeeExceptionForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |
| `/exceptions/cancel` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=cancel , activity=exception_cancel` | employeeExceptionForm / request | success: /exceptions/param.do; fail: /exceptions/param.do |
| `/exceptions/cancelParam` | [bzq.shf.actions.ExceptionAction](../SHF/src/bzq/shf/actions/ExceptionAction.java) | `param=cancel_param , activity=exception_cancel` | employeeExceptionForm / request | success: /jsp/cancel_exception_popup.jsp |
| `/shift/cancel` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=shift_cancel , activity=shift_cancel` | shiftDataForm / request | shiftsParam: /shift/searchParam.do; employeeCard: /employee/getShiftsParam.do |
| `/shift/add` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=add_extra_shift` | addShiftForm / request | success: /employee/showCard.do |
| `/shift/viewExtraShiftDialog` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=view_add_shift` | addShiftForm / request | success: /jsp/add_shift_popup.jsp |
| `/admin/viewActivityAim` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=findActivityAim,activity=admin_activity_view` | activityAimForm / request | success: /jsp/activity_aim.jsp |
| `/admin/viewActualJob` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=showActualJob,activity=actual_job` | actualJobForm / request | success: /jsp/actual_job.jsp |
| `/admin/insertActualJob` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=insertActualJob,activity=actual_job` | actualJobForm / request | success: /jsp/actual_job.jsp |
| `/admin/insertActivityAim` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=insertActivityAim,activity=admin_activity_view` | activityAimForm / request | success: /jsp/activity_aim_param.jsp |
| `/admin/deleteActivityAim` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=deleteActivityAim,activity=admin_activity_view` | activityAimForm / request | success: /admin/viewActivityAim.do; failure: /jsp/shf_fail.jsp |
| `/admin/saveActivityAim` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=saveActivityAim,activity=admin_activity_view` | activityAimForm / request | success: /admin/updateActivityAim.do?action=showActivityAim; successInsert: /admin/viewActivityAim.do?action=findActivityAim; insertCallAimFailed: /admin/viewActivityAim.do |
| `/admin/updateActivityAim` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=showActivityAim,activity=admin_activity_view` | activityAimForm / request | success: /jsp/activity_aim_param.jsp |
| `/shift/InforcePotentialParam` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=search_potential_inforce_param , activity=shift_inforce_update` | potentialInforceForm / request | success: /jsp/shift_inforce_potential.jsp |
| `/shift/InforcePotentialData` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=search_potential_inforce_data , activity=shift_inforce_update` | potentialInforceForm / request | success: /jsp/shift_inforce_potential.jsp |
| `/shift/InforcePotentialAdd` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=search_potential_inforce_add , activity=shift_inforce_update` | potentialInforceForm / request | success: /jsp/shift_inforce_potentialAdd.jsp; failure: /jsp/shift_inforce_potentialAdd.jsp; fail: /jsp/shift_inforce_potential.jsp |
| `/admin/updateActualJob` | [bzq.shf.actions.SystemAdminAction](../SHF/src/bzq/shf/actions/SystemAdminAction.java) | `param=updateActualJob,activity=actual_job` | actualJobForm / request | success: /jsp/actual_job.jsp; failure: /jsp/shf_fail.jsp; successUpdate: /admin/viewActualJob.do?action=showActualJob |
| `/shift/exportPotentialInforce` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=export_potentail` | potentialInforceForm / request |  |
| `/shift/addExtraAll` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=add_extra_shift_all` | addShiftForm / request | success: /jsp/shift_inforce_potentialAdd.jsp; successAdd: /shift/InforcePotentialData.do?action=search_potential_inforce_data |
| `/forecast/markedAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=marked_agents ` | forecastForm /  | success: /jsp/forecast_markedAgent.jsp |
| `/forecast/lateAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=late_agents` | forecastForm /  | success: /jsp/forecast_lateAgent.jsp |
| `/forecast/missingAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=missing_agents` | forecastForm /  | success: /jsp/forecast_missingAgent.jsp |
| `/forecast/futureAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=future_agents` | forecastForm /  | success: /jsp/forecast_futureAgent.jsp |
| `/forecast/arrivalAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=arrival_agents` | forecastForm /  | success: /jsp/forecast_arrivalAgent.jsp |
| `/forecast/shiftingAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=shifting_agents` | forecastForm /  | success: /jsp/forecast_shiftingAgent.jsp |
| `/forecast/extensionAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=extension_agents` | forecastForm /  | success: /jsp/forecast_shiftingAgent.jsp |
| `/forecast/reducingAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=reducing_agents` | forecastForm /  | success: /jsp/forecast_shiftingAgent.jsp |
| `/forecast/activitySwitch` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=activitySwitch` | forecastForm /  | success: /jsp/forecast_activitySwitch.jsp |
| `/forecast/extraAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=extra_agents` | forecastForm /  | success: /jsp/forecast_shiftingAgent.jsp |
| `/forecast/cancelAgent` | [bzq.shf.actions.ForecastAction](../SHF/src/bzq/shf/actions/ForecastAction.java) | `param=cancel_agents` | forecastForm /  | success: /jsp/forecast_shiftingAgent.jsp |
| `/shift/cancelLoginView` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=shift_cancel_login_view , activity=shift_cancel` | shiftLoginCancelForm / request | success: /jsp/add_cancel_login_dialog_1.jsp |
| `/shift/cancelLoginUpdate` | [bzq.shf.actions.ShiftDataAction](../SHF/src/bzq/shf/actions/ShiftDataAction.java) | `param=shift_cancel_login_update , activity=shift_cancel` | shiftLoginCancelForm / request | success: /jsp/shifts_search_list.jsp; fail: /jsp/shifts_search_list.jsp |
| `/wfmReport` | [bzq.wfm.report.ScheduleHomeAction](../SHF/src/bzq/wfm/report/ScheduleHomeAction.java) | `param= , activity=` | wfmReportForm / request | success: /jsp/wfm/schedule_report_params.jsp; successReport: /wfmReport.do |
| `/wfmReport/getForecast` | [bzq.wfm.report.ScheduleForecastAction](../SHF/src/bzq/wfm/report/ScheduleForecastAction.java) | `param= , activity=` | wfmReportForm / request | success: /jsp/wfm/forecast_select.jsp |
| `/wfmReport/getSites` | [bzq.wfm.report.ScheduleSitesAction](../SHF/src/bzq/wfm/report/ScheduleSitesAction.java) | `param= , activity=` | wfmReportForm / request | success: /jsp/wfm/site_select.jsp |
| `/wfmHRReport` | [bzq.wfm.report.ScheduleHomeAction](../SHF/src/bzq/wfm/report/ScheduleHomeAction.java) | `param=HR` | wfmReportForm / request | success: /jsp/wfm/hr_report_params.jsp |
| `/mobile/ReportParam` | [bzq.shf.actions.PlatformAction](../SHF/src/bzq/shf/actions/PlatformAction.java) | `param=param` | UsageReportForm / request | success: /mobile/ReportResult.do |
| `/mobile/ReportResult` | [bzq.shf.actions.PlatformAction](../SHF/src/bzq/shf/actions/PlatformAction.java) | `param=result` | UsageReportForm / request | success: /jsp/shf_usage_report.jsp |
| `/mobile/ReportExport` | [bzq.shf.actions.PlatformAction](../SHF/src/bzq/shf/actions/PlatformAction.java) | `param=export` | UsageReportForm / request |  |
| `/IWD/peleParam` | [bzq.shf.actions.IWDAction](../SHF/src/bzq/shf/actions/IWDAction.java) | `param=pele_param` | PeleIWDForm / request | result: /IWD/peleResult.do; success: /jsp/peleIWD.jsp |
| `/IWD/peleResult` | [bzq.shf.actions.IWDAction](../SHF/src/bzq/shf/actions/IWDAction.java) | `param=pele_result` | PeleIWDForm / request | success: /jsp/peleIWD.jsp |
| `/IWD/peleSchedule` | [bzq.shf.actions.IWDAction](../SHF/src/bzq/shf/actions/IWDAction.java) | `param=pele_schedule` | PeleIWDForm / request | success: /IWD/peleResult.do |
| `/IWD/peleScheduleCancel` | [bzq.shf.actions.IWDAction](../SHF/src/bzq/shf/actions/IWDAction.java) | `param=pele_schedule_cancel` | PeleIWDForm / request | success: /IWD/peleResult.do |
| `/admin/assignTeamToBuilding` | [bzq.shf.actions.ManageBuildingsAction](../SHF/src/bzq/shf/actions/ManageBuildingsAction.java) | `param=view_teams` | buildingForm / request | success: /jsp/admin/assign_team_to_building.jsp |
| `/admin/updateTeamBuilding` | [bzq.shf.actions.ManageBuildingsAction](../SHF/src/bzq/shf/actions/ManageBuildingsAction.java) | `param=update_team_building` | teamForm / request | success: /jsp/shf_success.jsp; fail: /jsp/shf_fail.jsp |

## 2. Form Binding Catalog

Only fields declared directly in the readable class are indexed. Inherited fields, setter transformations, custom validation, and proprietary library classes require the design and source review; these declarations are not replacement API schemas.

| Form name | Java type / evidence | Directly declared instance fields |
| --- | --- | --- |
| `loginForm` | [bzq.shf.forms.LoginForm](../SHF/src/bzq/shf/forms/LoginForm.java) | domain_user: String; generalAuthorization: String; password: String; specificAuthorization: String; ssoExtraMessage: String; ssoMessage: String; user: String; userfirstname: String; userlastname: String |
| `employeeArriveForm` | [bzq.shf.forms.EmployeeArriveForm](../SHF/src/bzq/shf/forms/EmployeeArriveForm.java) | agentMood: int; approveManager: Vector; attendanceValue: int; breaks: Vector; lateSource: String; missDateEnd: String; missDateStart: String; tadreech: int |
| `employeeActivitiesForm` | [bzq.shf.forms.EmployeeActivitiesForm](../SHF/src/bzq/shf/forms/EmployeeActivitiesForm.java) | from: Date; to: Date |
| `eventForm` | [bzq.shf.bean.EmployeeEventBean](../SHF/src/bzq/shf/bean/EmployeeEventBean.java) | agentMood: int; creation_time: Date; creation_user: String; date: Date; employee_day_id: long; employee_id: int; eventId: int; eventType: int; hour: String; length: int; otherEventDesc: String; reason: int; remark: String; reported: int; reportRequested: int; serType: int; status: int; time: Date |
| `employeeSearchForm` | [bzq.shf.forms.EmployeeListForm](../SHF/src/bzq/shf/forms/EmployeeListForm.java) | first_name: String; id_number: String; innerJob: String[]; job: String; last_name: String; moked: String; status: int; team: String[] |
| `employeeDataForm` | [bzq.shf.forms.EmployeeDataForm](../SHF/src/bzq/shf/forms/EmployeeDataForm.java) | No matching direct field declarations; inspect inherited fields. |
| `eventReason` | [bzq.shf.transfer.EventReason](../SHF/src/bzq/shf/transfer/EventReason.java) | branch: String; reasonId: int; reasonName: String; reported: int; reportRequested: int; type: int |
| `shiftDataForm` | [bzq.shf.forms.ShiftDataForm](../SHF/src/bzq/shf/forms/ShiftDataForm.java) | cancelBreakSwitch: boolean; cbChecked: String; currentTime: String; isSwitchPotential: boolean; mokedForCheck: String; myAgafMokedUnits: Vector<bzq.shf.forms.OrgUnitTableForm>; newEndDate: Date; newEndStatusForUpdate: String; newEndTime: String; newSplitEndTime: String; newSplitStartTime: String; newStartDate: Date; newStartStatusForUpdate: String; newStartTime: String; shiftExtNum: String; shiftLocation: String; shiftsFile: FormFile; tree: ShiftTreeNodeBean |
| `adminForm` | [bzq.shf.forms.SystemAdminForm](../SHF/src/bzq/shf/forms/SystemAdminForm.java) | agaf: String; agafSendSwitchOfferSMS: boolean; iwdDefaultTimeToComplete: String; iwdMinAfterShiftStart: String; iwdMinBeforeShiftEnd: String; iwdRescheduleOnAgentBreak: boolean; lockEmployees: boolean; lockMissingNum: String; managedBreakEnabled: boolean; managedBreakMinTimeBeforeChange: String; maxDifferenceForSwitch: String; maximalShiftDurationForCR: String; maxMinutesToExitAfterEnd: String; maxSelectForSwitchOffer: String; maxToExitBeforEndShift: String; minBeforeChangeRequest: String; minBeforeReduceRequest: String; minHoursBeforeSwitch: String; minHoursBeforeSwitchBreak: String; minHoursBetweenShifts: String; minimalBreakLate: String; minimalBreakShifting: String; minimalShiftDuration: String; minimalShiftDurationForCR: String; minTimeFromLastShift: String; minTimeFromNextShift: String; minutesBeforeLate: String; moked: String; poolEnabled: boolean; poolTimeAfterShiftEnd: String; poolTimeBeforeShiftStart: String; poolTimeNoArrival: String |
| `shiftInforceForm` | [bzq.shf.forms.ShiftInforceRequestForm](../SHF/src/bzq/shf/forms/ShiftInforceRequestForm.java) | action: String; activity: String; addedShiftsNum: int; breaksNumber: int; categoryJob: int; creationTime: Date; date: Date; days: AgentDayBean[]; EndPotential: Date; firstBreakLength: int; firstBreakTime: String; firstName: String; id: int; innerJob: String[]; innerJobBean: InnerJobBean[]; innerJobNumber: int[]; LastName: String; modificationTime: Date; moked: String; moreDetails: int; numOfAgents: int; orgUnitBean: OrgUnitBean[]; originalNumOfAgents: int; remark: String; secondBreakLength: int; secondBreakTime: String; shiftEnd: Date; shiftStart: Date; skill: int; StartPotential: Date; team: String[]; teamNumber: String[]; thirdBreakLength: int; thirdBreakTime: String; trained: int; user: String; workFromHome: int |
| `replaceForm` | [bzq.shf.transfer.ReplaceByCritrion](../SHF/src/bzq/shf/transfer/ReplaceByCritrion.java) | activity: String; employeeId: String; employeeOrgUnit: String; employeePersonalId: String; endTime: Date; fullname: String; innerJob: String; managerId: String; shiftId: String; site: String; startTime: Date; switchPotentialFormSite: String; switchPotentialList: String |
| `messageForm` | [bzq.shf.transfer.ReplaceMassage](../SHF/src/bzq/shf/transfer/ReplaceMassage.java) | creationDate: Date; empId: int; id: int; isDeleted: String; isRead: String; msgType: String; note: String; offerEmployeeId: int; offerFullName: String; offerShiftEnd: Date; offerShiftId: int; offerShiftStart: Date; selectedRows: String; shiftEnd: Date; shiftId: int; shiftStart: Date; subject: String; text: String |
| `skillForm` | [bzq.shf.transfer.SkillForm](../SHF/src/bzq/shf/transfer/SkillForm.java) | isLanguage: int; skillDesc: String; skillId: int; skillName: String |
| `addEventForm` | [bzq.shf.bean.EmployeeEventBean](../SHF/src/bzq/shf/bean/EmployeeEventBean.java) | agentMood: int; creation_time: Date; creation_user: String; date: Date; employee_day_id: long; employee_id: int; eventId: int; eventType: int; hour: String; length: int; otherEventDesc: String; reason: int; remark: String; reported: int; reportRequested: int; serType: int; status: int; time: Date |
| `offerReplaceForm` | [bzq.shf.transfer.OfferReplaceByCritrion](../SHF/src/bzq/shf/transfer/OfferReplaceByCritrion.java) | activity: String; employeeOrgUnit: String; note: String; offer: String; offerEmployeeId: String; offerEmployeeIdNum: String; offerEndTime: Date; offerFullName: String; offerManagerId: String; offerOrgUnitID: String; offerStartTime: Date; offersToMe: Vector<OfferReplaceByCritrion>; status: String |
| `addShiftRequestForm` | [bzq.shf.forms.AddShiftRequestForm](../SHF/src/bzq/shf/forms/AddShiftRequestForm.java) | activity: String; date: Date; empIdNumber: String; from: String; inforceRequestId: int; moked: String; sourceWindow: String; to: String |
| `employeeInforceForm` | [bzq.shf.forms.EmployeeInforceListForm](../SHF/src/bzq/shf/forms/EmployeeInforceListForm.java) | agentDayBeans: AgentDayBean[]; employee: EmployeeBean[]; end_potential: Date; sourceWindow: String; start_potential: Date |
| `attendanceDataForm` | [bzq.shf.forms.AttendanceDataForm](../SHF/src/bzq/shf/forms/AttendanceDataForm.java) | missingDays: int; reportApproveTime: Date; reportRequired: int |
| `breakForm` | [bzq.shf.forms.BreakSearchForm](../SHF/src/bzq/shf/forms/BreakSearchForm.java) | actionType: String; activity: String[]; allTab: HashMap; breakAgentDayId: long; breakVecCurrent: Vector; breakVecExceptional: Vector; date: Date; firstName: String; innerJob: String[]; lastName: String; moked: String; refhreshed_time: String; shiftLocation: String[]; teamCode: String[]; time: String; to_time: String |
| `forecastForm` | [bzq.shf.forms.ForecastForm](../SHF/src/bzq/shf/forms/ForecastForm.java) | activitiesForSelect: String; activity: String; activityList: String[]; allday: boolean; date: Date; department: String; exceptionList: String[]; exceptionsForSelect: String; from: String; indexForSearch: int; innerJobList: String[]; localActArr: String[]; moked: String; rbChoice: String; rbWithoutSign: boolean; sumCallLength: float; sumCallLengthTime: String; sumCallsNum: int; sumCallVal: int; sumForecastCallLength: float; sumForecastCallLengthTime: String; sumForecastCallsNum: int; sumGapTime: String; sumMokedCallLengthList: String[]; team: String; timeFrom: String; timeTo: String; virtualActivity: String[]; withBreak: boolean; withCalc: boolean; withChange: boolean; withException: boolean; withNeto: boolean; withNetoBreak: boolean; withReq: boolean; withSum: boolean; withWfm: boolean |
| `breakBeanForm` | [bzq.shf.bean.BreakBean](../SHF/src/bzq/shf/bean/BreakBean.java) | breakRemark: String; empIdNumber: String; employeeId: String; firstName: String; innerJobId: String; isNewCandidate: int; lastName: String; minuteLate: long; newActivity: String; newWorkFromHome: String; orgUnitId: String; wmActivityId: String; workFromHome: String |
| `breakCandidateBeanForm` | [bzq.shf.bean.BreakCandidateBean](../SHF/src/bzq/shf/bean/BreakCandidateBean.java) | breakStart: Date; creationDate: Date; employeeDayId: long; errReason: String; modifiedDate: Date; offerCaDetails: BreakCandidateBean; offerDayId: long; offerEmpIdNumber: String; offerOrgUnitId: String; offerStartDate: Date; status: String |
| `shiftBreakForm` | [bzq.shf.forms.ShiftBreakForm](../SHF/src/bzq/shf/forms/ShiftBreakForm.java) | agentDayId: long; breaksNumber: int; dateEnd: Date; firstBreakEnded: int; firstBreakLength: int; firstBreakLengthOld: int; firstBreakStartDateTime: Date; firstBreakStarted: int; firstBreakTime: String; firstBreakTimeOld: String; originalShiftEnd: String; originalShiftStart: String; secondBreakEnded: int; secondBreakLength: int; secondBreakLengthOld: int; secondBreakStartDateTime: Date; secondBreakStarted: int; secondBreakTime: String; secondBreakTimeOld: String; thirdBreakEnded: int; thirdBreakLength: int; thirdBreakLengthOld: int; thirdBreakStartDateTime: Date; thirdBreakStarted: int; thirdBreakTime: String; thirdBreakTimeOld: String |
| `exceptionForm` | [bzq.shf.forms.EmployeeExceptionForm](../SHF/src/bzq/shf/forms/EmployeeExceptionForm.java) | employeeId: String; from: String; fullday: int; to: String |
| `switchForm` | [bzq.shf.forms.SwitchForm](../SHF/src/bzq/shf/forms/SwitchForm.java) | firstDayId: long; message: String; secondDayId: long |
| `reduceShiftReqtForm` | [bzq.shf.forms.ShiftReduceRequestForm](../SHF/src/bzq/shf/forms/ShiftReduceRequestForm.java) | agentDayList: AgentDayBean[]; date: Date; empList: EmployeeBean[]; reduceList: ShiftReduceListForm[]; sourceWindow: String; sumApproved: int; time: String |
| `shiftChangeRequestForm` | [bzq.shf.forms.ShiftChangeRequestForm](../SHF/src/bzq/shf/forms/ShiftChangeRequestForm.java) | activity: String; agentDaysApplications: Vector; agentsNum: int; aprovedNum: int; autoApprove: int; candidate: ChangeRequestCandidate; changeEndOption: String; changeEndSelected: int; changeStartOption: String; changeStartSelected: int; createdBy: String; creationTime: Date; date: Date; endFrom: String; endFromDate: Date; endTo: String; endToDate: Date; modificationTime: Date; modifiedBy: String; moked: String; newEndTime: String; newEndTimeDate: Date; newExtraMinutesAtEnd: int; newExtraMinutesAtStart: int; newLessMinutesAtEnd: int; newLessMinutesAtStart: int; newStartTime: String; newStartTimeDate: Date; requestId: long; shiftEndOption: int; shiftLength: int; shiftLengthOption: int; shiftStartOption: int; startFrom: String; startFromDate: Date; startTo: String; startToDate: Date |
| `reduceShiftListForm` | [bzq.shf.forms.ShiftReduceListForm](../SHF/src/bzq/shf/forms/ShiftReduceListForm.java) | automaticApprove: String; endTime: String; sourceWindow: String; startTime: String |
| `changeRequestCandidate` | [bzq.shf.bean.ChangeRequestCandidate](../SHF/src/bzq/shf/bean/ChangeRequestCandidate.java) | approveTime: Date; creationTime: Date; modificationTime: Date; modificationUser: String; requestId: long |
| `ctiCompletionForm` | [bzq.shf.forms.CTICompletionForm](../SHF/src/bzq/shf/forms/CTICompletionForm.java) | actionCode: String; activity: String; agaf: String; allchecked: String; byShiftActivity: boolean; byShiftEnd: boolean; byShiftStart: boolean; completionCode: String; completionEnd: String; completionFromDate: String; completionsEnd: String[]; completionsStart: String[]; completionStart: String; completionToDate: String; ctiAllowedMoked: String; end: Date; first_name: String; id_number: String; job: String; last_name: String; moked: String; personalData: boolean; selectedEmployees: Integer[]; shiftData: boolean; shiftDate: String; shiftEndFrom: String; shiftEndTo: String; shiftStartFrom: String; shiftStartTo: String; start: Date; statusId: int; team: String[]; unitData: boolean |
| `ctiSearchCompletionForm` | [bzq.shf.forms.CTISearchCompletionForm](../SHF/src/bzq/shf/forms/CTISearchCompletionForm.java) | actionCode: String; activity: String; agaf: String; completionCode: String; completionFromDate: String; completionFromTime: String; completionsCodes: String[]; completionsEnd: String[]; completionsEndDates: String[]; completionsStart: String[]; completionsStartDates: String[]; completionStatus: String; completionToDate: String; completionToTime: String; firstName: String; id_number: String; job: String; lastName: String; moked: String; selectedCompletions: Integer[]; sourceSystem: String; team: String; updatingUser: String; users: Vector<TableForm> |
| `baseForm` | [bzq.shf.bean.ShfBaseBean](../SHF/src/bzq/shf/bean/ShfBaseBean.java) | allowedActivities: java.util.Vector; allowedAgaf: String; allowedMoked: String; allowedUnits: java.util.Vector; sourceActivity: String; userFirstName: String; userId: String; userLastName: String |
| `tableForm` | [bzq.shf.forms.TableForm](../SHF/src/bzq/shf/forms/TableForm.java) | code: java.lang.String; description: java.lang.String |
| `innerJobForm` | [bzq.shf.forms.InnerJobForm](../SHF/src/bzq/shf/forms/InnerJobForm.java) | action: String |
| `exceptionSearchForm` | [bzq.shf.forms.ExceptionSearchForm](../SHF/src/bzq/shf/forms/ExceptionSearchForm.java) | activity: String[]; date: String; exceptionCode: String[]; innerJob: String[]; moked: String; team: String[]; timeFrom: String; timeoffCode: String[]; timeTo: String |
| `shiftCancelledForm` | [bzq.shf.forms.ActivityCancelForm](../SHF/src/bzq/shf/forms/ActivityCancelForm.java) | activity: String[]; eventReasonCode: String[]; exceptionCode: String[]; innerJob: String[]; moked: String; team: String[]; timeFrom: String; timeTo: String |
| `employeeExceptionForm` | [bzq.shf.forms.EmployeeExceptionForm](../SHF/src/bzq/shf/forms/EmployeeExceptionForm.java) | employeeId: String; from: String; fullday: int; to: String |
| `addShiftForm` | [bzq.shf.forms.AddShiftForm](../SHF/src/bzq/shf/forms/AddShiftForm.java) | activity: String; breakEnd: String[]; breakPotentialAll: String[]; breaksNumber: int; breakStart: String[]; date: String; employeeId: int; employeeIdPotentialAll: int[]; fullIdNumber: String; idNumber: String; idNumberPotentialAll: String[]; moked: String; remark: String; send: boolean; shiftEnd: String; shiftLocation: String; shiftLocationAll: String[]; shiftSplit: boolean; shiftSplitEnd: String; shiftSplitStart: String; shiftStart: String |
| `activityAimForm` | [bzq.shf.forms.ActivityAimForm](../SHF/src/bzq/shf/forms/ActivityAimForm.java) | activityType: String; aimDefultValue: String; virtualActivityName: String |
| `activityAimBean` | [bzq.shf.bean.ActivityAimBean](../SHF/src/bzq/shf/bean/ActivityAimBean.java) | activity: String; activityAim: String; activityAimArray: String[][]; activityDay: Integer; modificationTime: Date; modificationUser: String; moked: String; rbChoice: String; virtualActivity: String |
| `actualJobForm` | [bzq.shf.forms.ActualJobForm](../SHF/src/bzq/shf/forms/ActualJobForm.java) | No matching direct field declarations; inspect inherited fields. |
| `potentialInforceForm` | [bzq.shf.forms.PotentialInforceForm](../SHF/src/bzq/shf/forms/PotentialInforceForm.java) | action: String; activity: String; breaksNumber: int; categoryJob: boolean; date: Date; days: AgentDayBean[]; empIdNumber: String[]; EndPotential: Date; EndPotentialDT: Date; endTimeInforce: Date; endTimeInforceToCheck: Date; fieldsMapping: HashMap; firstBreakLength: int; firstBreakTime: String; firstName: String; id: int; idNumber: int[]; innerJob: String[]; lastName: String; maxLength: Integer; moked: String; moreDetails: int; potentialEmployeeBeans: PotentialEmployeeBean[]; potentialInforceData: Vector; remark: String; secondBreakLength: int; secondBreakTime: String; selectedPotential: String[]; skill: int; sourceWindow: String; StartPotential: Date; StartPotentialDT: Date; startTimeInforce: Date; startTimeInforceToCheck: Date; team: String[]; thirdBreakLength: int; thirdBreakTime: String; trained: boolean; workFromHome: boolean |
| `shiftLoginCancelForm` | [bzq.shf.forms.ShiftLoginCancelForm](../SHF/src/bzq/shf/forms/ShiftLoginCancelForm.java) | agantFirstName: String; agantLastName: String; agantOrgUnit: String; applierFirstName: String; applierLastName: String; applierVec: Vector; employeeId: int; missingReasonId: int; shiftEnd: Date; shiftEndDate: String; shiftEndTime: String; shiftStart: Date; shiftStartDate: String; shiftStartTime: String; updaterFirstName: String; updaterLastName: String; updaterVec: Vector |
| `buildingForm` | [bzq.shf.forms.BuildingForm](../SHF/src/bzq/shf/forms/BuildingForm.java) | action: String; address: String; code: int; name: String; orgUnit: String; seatsNum: int |
| `wfmReportForm` | [bzq.wfm.report.WfmReportForm](../SHF/src/bzq/wfm/report/WfmReportForm.java) | activityList: String[]; agaf: String; businessUnit: String; forecastId: String; from: Date; innerJob: String[]; job: String; moked: String; path: String; scenario: boolean; scheduleId: String; siteId: String; skillList: String[]; status: int; team: String[]; to: Date |
| `teamForm` | [bzq.shf.forms.TeamForm](../SHF/src/bzq/shf/forms/TeamForm.java) | buildingId: int; buildingName: String |
| `UsageReportForm` | [bzq.shf.forms.UsageReportForm](../SHF/src/bzq/shf/forms/UsageReportForm.java) | dateFrom: String; dateTo: String; formAction: String; moked: String |
| `PeleIWDForm` | [bzq.shf.forms.PeleIWDForm](../SHF/src/bzq/shf/forms/PeleIWDForm.java) | agaf: String; amountPerTiming: int; innerJob: String[]; innerJobId: int; intervalSize: int; module: String[]; moduleId: int; moked: String[]; mokedId: String; totalForTiming: int; userAgaf: String |
| `optShfSpForm` | [bzq.shf.forms.OptShfSpForm](../SHF/src/bzq/shf/forms/OptShfSpForm.java) | flaggedUnits: String[]; userProfile: UserProfile |
| `SoftPhoneForm` | [bzq.shf.forms.SoftPhoneForm](../SHF/src/bzq/shf/forms/SoftPhoneForm.java) | agent_day_id: long; date: Date; employee_id: String; end_date_updated: Date; param: String; start_date_planned: Date; start_date_updated: Date; uid: String |

## 3. Qualified Database Identifier Candidates

This static identifier index includes commented code and SQL fragments. Entries may be tables, views, sequences, package names, or qualified column references. It does not prove object existence, grants, constraints, active use, or Oracle object type. Unqualified identifiers and dynamic SQL can be missed. Confirm with the read-only schema discovery SQL.

| Qualified identifier candidate | Occurrences | Source references (first four) |
| --- | --- | --- |
| `SHIFTER.PROCESS_DOC_KEY` | 1 | [SHFBatch/src/bzq/shf/batch/Process.java:114](../SHFBatch/src/bzq/shf/batch/Process.java#L114) |
| `SHIFTER.SHF_ACTIVITY_CALL_TIME_AIM` | 6 | [SHF/src/bzq/shf/model/ForecastModel.java:926](../SHF/src/bzq/shf/model/ForecastModel.java#L926); [SHF/src/bzq/shf/model/SystemAdminModel.java:466](../SHF/src/bzq/shf/model/SystemAdminModel.java#L466); [SHF/src/bzq/shf/model/SystemAdminModel.java:510](../SHF/src/bzq/shf/model/SystemAdminModel.java#L510); [SHF/src/bzq/shf/model/SystemAdminModel.java:573](../SHF/src/bzq/shf/model/SystemAdminModel.java#L573) |
| `SHIFTER.SHF_ACTIVITY_SKILL` | 5 | [SHF/src/bzq/shf/model/EmployeeDataModel.java:1018](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1018); [SHF/src/bzq/shf/model/ExceptionDataModel.java:447](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L447); [SHF/src/bzq/shf/model/ExceptionDataModel.java:571](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L571); [SHF/src/bzq/shf/model/ExceptionDataModel.java:716](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L716) |
| `SHIFTER.SHF_ACTIVITY_TYPE` | 7 | [SHF/src/bzq/shf/model/ForecastModel.java:1107](../SHF/src/bzq/shf/model/ForecastModel.java#L1107); [SHF/src/bzq/shf/model/ForecastModel.java:1195](../SHF/src/bzq/shf/model/ForecastModel.java#L1195); [SHF/src/bzq/shf/model/ForecastModel.java:3681](../SHF/src/bzq/shf/model/ForecastModel.java#L3681); [SHF/src/bzq/shf/model/ForecastModel.java:3740](../SHF/src/bzq/shf/model/ForecastModel.java#L3740) |
| `SHIFTER.SHF_AGENT_DAY_ID` | 2 | [SHF/src/bzq/shf/model/ShiftDataModel.java:3307](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3307); [SHF/src/bzq/shf/model/ShiftDataModel.java:5819](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5819) |
| `SHIFTER.SHF_ATTENDANCE` | 73 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:728](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L728); [SHF/src/bzq/shf/model/AttendanceDataModel.java:1017](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1017); [SHF/src/bzq/shf/model/AttendanceDataModel.java:1068](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1068); [SHF/src/bzq/shf/model/AttendanceDataModel.java:1081](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1081) |
| `SHIFTER.SHF_BATCH_DOCS` | 38 | [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java:391](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L391); [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java:430](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L430); [SHFBatch/src/bzq/shf/batch/CtiBatchModel.java:26](../SHFBatch/src/bzq/shf/batch/CtiBatchModel.java#L26); [SHFBatch/src/bzq/shf/batch/CTIProcess2.java:412](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L412) |
| `SHIFTER.SHF_BATCH_PROCESS` | 3 | [SHFBatch/src/bzq/shf/batch/Process.java:473](../SHFBatch/src/bzq/shf/batch/Process.java#L473); [SHFBatch/src/bzq/shf/batch/Process.java:525](../SHFBatch/src/bzq/shf/batch/Process.java#L525); [SHFBatch/src/bzq/shf/batch/Process.java:79](../SHFBatch/src/bzq/shf/batch/Process.java#L79) |
| `SHIFTER.SHF_BREAK_SMS` | 3 | [SHF/src/bzq/shf/model/SoftPhoneModel.java:132](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L132); [SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java:108](../SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java#L108); [SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java:53](../SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java#L53) |
| `SHIFTER.SHF_BREAK_SMS_ID` | 1 | [SHF/src/bzq/shf/model/SoftPhoneModel.java:139](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L139) |
| `SHIFTER.SHF_BUILDING` | 8 | [SHF/src/bzq/shf/model/BuildingModel.java:120](../SHF/src/bzq/shf/model/BuildingModel.java#L120); [SHF/src/bzq/shf/model/BuildingModel.java:148](../SHF/src/bzq/shf/model/BuildingModel.java#L148); [SHF/src/bzq/shf/model/BuildingModel.java:176](../SHF/src/bzq/shf/model/BuildingModel.java#L176); [SHF/src/bzq/shf/model/BuildingModel.java:219](../SHF/src/bzq/shf/model/BuildingModel.java#L219) |
| `SHIFTER.SHF_BUILDING_ID` | 1 | [SHF/src/bzq/shf/model/BuildingModel.java:120](../SHF/src/bzq/shf/model/BuildingModel.java#L120) |
| `SHIFTER.SHF_BUILDING_TEAM` | 6 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:729](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L729); [SHF/src/bzq/shf/model/BuildingModel.java:175](../SHF/src/bzq/shf/model/BuildingModel.java#L175); [SHF/src/bzq/shf/model/BuildingModel.java:218](../SHF/src/bzq/shf/model/BuildingModel.java#L218); [SHF/src/bzq/shf/model/BuildingModel.java:289](../SHF/src/bzq/shf/model/BuildingModel.java#L289) |
| `SHIFTER.SHF_CATEGORY_JOB` | 10 | [SHF/src/bzq/shf/model/EmployeeDataModel.java:926](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L926); [SHF/src/bzq/shf/model/ShiftDataModel.java:2666](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2666); [SHF/src/bzq/shf/model/ShiftDataModel.java:6423](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6423); [SHF/src/bzq/shf/model/ShiftDataModel.java:6583](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6583) |
| `SHIFTER.SHF_CATEGORY_TYPE` | 2 | [SHF/src/bzq/shf/model/LoadTables.java:291](../SHF/src/bzq/shf/model/LoadTables.java#L291); [SHF/src/bzq/shf/model/SystemAdminModel.java:780](../SHF/src/bzq/shf/model/SystemAdminModel.java#L780) |
| `SHIFTER.SHF_CTI_AFTER_HANDLED` | 2 | [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:409](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L409); [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java:409](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L409) |
| `SHIFTER.SHF_CTI_BEFORE_HANDLED` | 10 | [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:122](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L122); [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:642](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L642); [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:644](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L644); [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:691](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L691) |
| `SHIFTER.SHF_CTI_CANCEL_LOGIN_SHIFTS` | 9 | [SHF/src/bzq/shf/model/AttendanceDataModel.java:440](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L440); [SHF/src/bzq/shf/model/AttendanceDataModel.java:571](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L571); [SHF/src/bzq/shf/model/ShiftDataModel.java:401](../SHF/src/bzq/shf/model/ShiftDataModel.java#L401); [SHF/src/bzq/shf/model/ShiftDataModel.java:557](../SHF/src/bzq/shf/model/ShiftDataModel.java#L557) |
| `SHIFTER.SHF_CTI_COMPLETIONS` | 4 | [SHF/src/bzq/shf/model/CTICompletion.java:161](../SHF/src/bzq/shf/model/CTICompletion.java#L161); [SHF/src/bzq/shf/model/CTICompletion.java:539](../SHF/src/bzq/shf/model/CTICompletion.java#L539); [SHF/src/bzq/shf/utils/ComplexCodeTable.java:40](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L40); [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:438](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L438) |
| `SHIFTER.SHF_CTI_COPLETION_ID` | 1 | [SHF/src/bzq/shf/model/CTICompletion.java:1035](../SHF/src/bzq/shf/model/CTICompletion.java#L1035) |
| `SHIFTER.SHF_CTI_EMP_COMPLETION_PARTS` | 4 | [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:233](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L233); [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:265](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L265); [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:438](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L438); [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:588](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L588) |
| `SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS` | 19 | [SHF/src/bzq/shf/model/CTICompletion.java:1033](../SHF/src/bzq/shf/model/CTICompletion.java#L1033); [SHF/src/bzq/shf/model/CTICompletion.java:1053](../SHF/src/bzq/shf/model/CTICompletion.java#L1053); [SHF/src/bzq/shf/model/CTICompletion.java:160](../SHF/src/bzq/shf/model/CTICompletion.java#L160); [SHF/src/bzq/shf/model/CTICompletion.java:297](../SHF/src/bzq/shf/model/CTICompletion.java#L297) |
| `SHIFTER.SHF_CTI_JOB_TO_SAP` | 9 | [SHF/src/bzq/shf/model/CTICompletion.java:1111](../SHF/src/bzq/shf/model/CTICompletion.java#L1111); [SHF/src/bzq/shf/model/CTICompletion.java:1137](../SHF/src/bzq/shf/model/CTICompletion.java#L1137); [SHF/src/bzq/shf/model/CTICompletion.java:1158](../SHF/src/bzq/shf/model/CTICompletion.java#L1158); [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:114](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L114) |
| `SHIFTER.SHF_CTI_PART_ID` | 2 | [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:377](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L377); [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java:377](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L377) |
| `SHIFTER.SHF_CTI_PARTS` | 5 | [SHFBatch/src/bzq/shf/batch/CTIProcess1.java:491](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L491); [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java:491](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L491); [SHFBatch/src/bzq/shf/batch/CTIProcess2.java:209](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L209); [SHFBatch/src/bzq/shf/batch/CTIProcess2.java:274](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L274) |
| `SHIFTER.SHF_CTI_SAP_REQ_ID` | 1 | [SHFBatch/src/bzq/shf/batch/CTIProcess4.java:769](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L769) |
| `SHIFTER.SHF_CTI_SHIFT_CREDIT` | 2 | [SHFBatch/src/bzq/shf/batch/CTIProcess3.java:243](../SHFBatch/src/bzq/shf/batch/CTIProcess3.java#L243); [SHFBatch/src/bzq/shf/batch/CTIProcess3.java:422](../SHFBatch/src/bzq/shf/batch/CTIProcess3.java#L422) |
| `SHIFTER.SHF_CTI_SHIFT_ID` | 1 | [SHFBatch/src/bzq/shf/batch/CTIProcess2.java:413](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L413) |
| `SHIFTER.SHF_CTI_SHIFTS` | 17 | [SHF/src/bzq/shf/model/CTICompletion.java:426](../SHF/src/bzq/shf/model/CTICompletion.java#L426); [SHFBatch/src/bzq/shf/batch/CTIProcess2.java:239](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L239); [SHFBatch/src/bzq/shf/batch/CTIProcess2.java:381](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L381); [SHFBatch/src/bzq/shf/batch/CTIProcess3.java:106](../SHFBatch/src/bzq/shf/batch/CTIProcess3.java#L106) |
| `SHIFTER.SHF_CTI_UNIT_CREDITS` | 1 | [SHFBatch/src/bzq/shf/batch/CTIProcess3.java:572](../SHFBatch/src/bzq/shf/batch/CTIProcess3.java#L572) |
| `SHIFTER.SHF_DAY_CHANGES` | 120 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1094](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1094); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1149](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1149); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:144](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L144); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:147](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L147) |
| `SHIFTER.SHF_EMPLOYEE_DAY` | 114 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1093](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1093); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1148](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1148); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:143](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L143); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:146](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L146) |
| `SHIFTER.SHF_EMPLOYEE_ENTRANCE_MOOD` | 2 | [SHF/src/bzq/shf/model/AttendanceDataModel.java:2631](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2631); [SHF/src/bzq/shf/model/AttendanceDataModel.java:2641](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2641) |
| `SHIFTER.SHF_EMPLOYEE_EVENT_ID` | 1 | [SHF/src/bzq/shf/model/EmployeeDataModel.java:1127](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1127) |
| `SHIFTER.SHF_EMPLOYEE_EVENTS` | 3 | [SHF/src/bzq/shf/model/EmployeeDataModel.java:1122](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1122); [SHF/src/bzq/shf/model/EmployeeDataModel.java:1193](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1193); [SHF/src/bzq/shf/model/EmployeeDataModel.java:549](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L549) |
| `SHIFTER.SHF_EMPLOYEE_EXCEPTIONS` | 46 | [SHF/src/bzq/shf/model/AttendanceDataModel.java:1309](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1309); [SHF/src/bzq/shf/model/BreakDataModel.java:1062](../SHF/src/bzq/shf/model/BreakDataModel.java#L1062); [SHF/src/bzq/shf/model/BreakDataModel.java:1158](../SHF/src/bzq/shf/model/BreakDataModel.java#L1158); [SHF/src/bzq/shf/model/BreakDataModel.java:1178](../SHF/src/bzq/shf/model/BreakDataModel.java#L1178) |
| `SHIFTER.SHF_EMPLOYEE_EXCEPTIONS_BASE` | 2 | [SHF/src/bzq/shf/model/ForecastModel.java:1484](../SHF/src/bzq/shf/model/ForecastModel.java#L1484); [SHF/src/bzq/shf/model/ForecastModel.java:1651](../SHF/src/bzq/shf/model/ForecastModel.java#L1651) |
| `SHIFTER.SHF_EMPLOYEE_REPORTS` | 5 | [SHF/src/bzq/shf/model/AttendanceDataModel.java:1202](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1202); [SHF/src/bzq/shf/model/AttendanceDataModel.java:198](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L198); [SHF/src/bzq/shf/model/AttendanceDataModel.java:2036](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2036); [SHF/src/bzq/shf/model/AttendanceDataModel.java:2339](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2339) |
| `SHIFTER.SHF_EMPLOYEE_SKILLS` | 8 | [SHF/src/bzq/shf/model/EmployeeDataModel.java:1005](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1005); [SHF/src/bzq/shf/model/EmployeeDataModel.java:1015](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1015); [SHF/src/bzq/shf/model/EmployeeDataModel.java:244](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L244); [SHF/src/bzq/shf/model/ExceptionDataModel.java:444](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L444) |
| `SHIFTER.SHF_EMPLOYEES` | 176 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1096](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1096); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1151](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1151); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:145](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L145); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:148](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L148) |
| `SHIFTER.SHF_EVENT_REASON` | 6 | [SHF/src/bzq/shf/dao/EventReasonDao.java:115](../SHF/src/bzq/shf/dao/EventReasonDao.java#L115); [SHF/src/bzq/shf/dao/EventReasonDao.java:153](../SHF/src/bzq/shf/dao/EventReasonDao.java#L153); [SHF/src/bzq/shf/dao/EventReasonDao.java:41](../SHF/src/bzq/shf/dao/EventReasonDao.java#L41); [SHF/src/bzq/shf/dao/EventReasonDao.java:76](../SHF/src/bzq/shf/dao/EventReasonDao.java#L76) |
| `SHIFTER.SHF_EVENT_REASON_ID` | 1 | [SHF/src/bzq/shf/dao/EventReasonDao.java:76](../SHF/src/bzq/shf/dao/EventReasonDao.java#L76) |
| `SHIFTER.SHF_EXCEPTION_TYPE` | 4 | [SHF/src/bzq/shf/model/ExceptionDataModel.java:214](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L214); [SHF/src/bzq/shf/model/ForecastModel.java:1739](../SHF/src/bzq/shf/model/ForecastModel.java#L1739); [SHF/src/bzq/shf/model/ForecastModel.java:3800](../SHF/src/bzq/shf/model/ForecastModel.java#L3800); [SHF/src/bzq/shf/utils/ComplexCodeTable.java:93](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L93) |
| `SHIFTER.SHF_FORECAST_ACTIVITIES` | 5 | [SHF/src/bzq/shf/model/ForecastModel.java:1010](../SHF/src/bzq/shf/model/ForecastModel.java#L1010); [SHF/src/bzq/shf/model/ForecastModel.java:1024](../SHF/src/bzq/shf/model/ForecastModel.java#L1024); [SHF/src/bzq/shf/model/ForecastModel.java:1041](../SHF/src/bzq/shf/model/ForecastModel.java#L1041); [SHF/src/bzq/shf/model/ForecastModel.java:3632](../SHF/src/bzq/shf/model/ForecastModel.java#L3632) |
| `SHIFTER.SHF_FORECAST_DATA` | 5 | [SHF/src/bzq/shf/model/ForecastModel.java:1011](../SHF/src/bzq/shf/model/ForecastModel.java#L1011); [SHF/src/bzq/shf/model/ForecastModel.java:1025](../SHF/src/bzq/shf/model/ForecastModel.java#L1025); [SHF/src/bzq/shf/model/ForecastModel.java:1042](../SHF/src/bzq/shf/model/ForecastModel.java#L1042); [SHF/src/bzq/shf/model/ForecastModel.java:3633](../SHF/src/bzq/shf/model/ForecastModel.java#L3633) |
| `SHIFTER.SHF_INNER_JOB_ID` | 1 | [SHF/src/bzq/shf/model/SystemAdminModel.java:690](../SHF/src/bzq/shf/model/SystemAdminModel.java#L690) |
| `SHIFTER.SHF_INNER_JOBS` | 8 | [SHF/src/bzq/shf/model/PlatformModel.java:80](../SHF/src/bzq/shf/model/PlatformModel.java#L80); [SHF/src/bzq/shf/model/ShiftDataModel.java:1757](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1757); [SHF/src/bzq/shf/model/ShiftDataModel.java:1918](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1918); [SHF/src/bzq/shf/model/SystemAdminModel.java:690](../SHF/src/bzq/shf/model/SystemAdminModel.java#L690) |
| `SHIFTER.SHF_INS_AND_RETURN_LASTID` | 1 | [SHF/src/bzq/shf/model/BreakDataModel.java:3267](../SHF/src/bzq/shf/model/BreakDataModel.java#L3267) |
| `SHIFTER.SHF_LAST_SHIFTS_VIEW` | 1 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:443](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L443) |
| `SHIFTER.SHF_MOBILE_AUDIT` | 2 | [SHF/src/bzq/shf/model/PlatformModel.java:39](../SHF/src/bzq/shf/model/PlatformModel.java#L39); [SHF/src/bzq/shf/model/PlatformModel.java:76](../SHF/src/bzq/shf/model/PlatformModel.java#L76) |
| `SHIFTER.SHF_MOBILE_AUDIT_REF` | 2 | [SHF/src/bzq/shf/model/PlatformModel.java:77](../SHF/src/bzq/shf/model/PlatformModel.java#L77); [SHF/src/bzq/shf/utils/ComplexCodeTable.java:84](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L84) |
| `SHIFTER.SHF_OPT_SHFSP_FLAG` | 4 | [SHF/src/bzq/shf/model/OptShfSpModel.java:206](../SHF/src/bzq/shf/model/OptShfSpModel.java#L206); [SHF/src/bzq/shf/model/OptShfSpModel.java:437](../SHF/src/bzq/shf/model/OptShfSpModel.java#L437); [SHF/src/bzq/shf/model/OptShfSpModel.java:489](../SHF/src/bzq/shf/model/OptShfSpModel.java#L489); [SHF/src/bzq/shf/model/OptShfSpModel.java:96](../SHF/src/bzq/shf/model/OptShfSpModel.java#L96) |
| `SHIFTER.SHF_ORG_UNIT` | 76 | [SHF/src/bzq/shf/model/AttendanceDataModel.java:1207](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1207); [SHF/src/bzq/shf/model/AttendanceDataModel.java:1394](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1394); [SHF/src/bzq/shf/model/AttendanceDataModel.java:1485](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1485); [SHF/src/bzq/shf/model/AttendanceDataModel.java:1519](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1519) |
| `SHIFTER.SHF_ORG_UNITS_SHF_SITES` | 2 | [SHF/src/bzq/shf/model/LoadTables.java:174](../SHF/src/bzq/shf/model/LoadTables.java#L174); [SHF/src/bzq/shf/utils/ComplexCodeTable.java:49](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L49) |
| `SHIFTER.SHF_ORG_UNITS_VIEW` | 1 | [SHF/src/bzq/wfm/report/HRReportModel.java:33](../SHF/src/bzq/wfm/report/HRReportModel.java#L33) |
| `SHIFTER.SHF_PELE_EMPLOYEES` | 8 | [SHF/src/bzq/shf/model/IWDModel.java:186](../SHF/src/bzq/shf/model/IWDModel.java#L186); [SHF/src/bzq/shf/model/IWDModel.java:510](../SHF/src/bzq/shf/model/IWDModel.java#L510); [SHF/src/bzq/shf/model/IWDModel.java:584](../SHF/src/bzq/shf/model/IWDModel.java#L584); [SHF/src/bzq/shf/model/IWDModel.java:630](../SHF/src/bzq/shf/model/IWDModel.java#L630) |
| `SHIFTER.SHF_PELE_EMPLOYEES_HISTORY` | 1 | [SHF/src/bzq/shf/model/IWDModel.java:679](../SHF/src/bzq/shf/model/IWDModel.java#L679) |
| `SHIFTER.SHF_PELE_IWD_SERVICE_CODES` | 1 | [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java:92](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L92) |
| `SHIFTER.SHF_PELE_LOMDOT` | 4 | [SHF/src/bzq/shf/model/IWDModel.java:185](../SHF/src/bzq/shf/model/IWDModel.java#L185); [SHF/src/bzq/shf/model/IWDModel.java:308](../SHF/src/bzq/shf/model/IWDModel.java#L308); [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java:64](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L64); [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java:81](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L81) |
| `SHIFTER.SHF_PERF_ACTIVITIES` | 1 | [SHF/src/bzq/shf/model/ForecastModel.java:994](../SHF/src/bzq/shf/model/ForecastModel.java#L994) |
| `SHIFTER.SHF_POOL_EXT_REQID` | 1 | [SHF/src/bzq/shf/model/ShiftDataModel.java:7458](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7458) |
| `SHIFTER.SHF_PROCESS_DOC_KEY` | 1 | [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java:370](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L370) |
| `SHIFTER.SHF_REPLACE_ACTIVITIES` | 2 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1808](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1808); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1887](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1887) |
| `SHIFTER.SHF_REPLACE_BREAK_CANDIDATES` | 22 | [SHF/src/bzq/shf/model/BreakDataModel.java:1013](../SHF/src/bzq/shf/model/BreakDataModel.java#L1013); [SHF/src/bzq/shf/model/BreakDataModel.java:1157](../SHF/src/bzq/shf/model/BreakDataModel.java#L1157); [SHF/src/bzq/shf/model/BreakDataModel.java:1261](../SHF/src/bzq/shf/model/BreakDataModel.java#L1261); [SHF/src/bzq/shf/model/BreakDataModel.java:1328](../SHF/src/bzq/shf/model/BreakDataModel.java#L1328) |
| `SHIFTER.SHF_REPLACE_CANDIDATES` | 35 | [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1016](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1016); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1027](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1027); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1095](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1095); [SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java:1150](../SHF/src/bzq/shf/dao/ReplaceByCritrionDao.java#L1150) |
| `SHIFTER.SHF_REPLACE_MASSAGE` | 5 | [SHF/src/bzq/shf/dao/ReplaceMassageDao.java:174](../SHF/src/bzq/shf/dao/ReplaceMassageDao.java#L174); [SHF/src/bzq/shf/dao/ReplaceMassageDao.java:223](../SHF/src/bzq/shf/dao/ReplaceMassageDao.java#L223); [SHF/src/bzq/shf/dao/ReplaceMassageDao.java:269](../SHF/src/bzq/shf/dao/ReplaceMassageDao.java#L269); [SHF/src/bzq/shf/dao/ReplaceMassageDao.java:45](../SHF/src/bzq/shf/dao/ReplaceMassageDao.java#L45) |
| `SHIFTER.SHF_REPLACE_MASSAGE_ID` | 1 | [SHF/src/bzq/shf/dao/ReplaceMassageDao.java:74](../SHF/src/bzq/shf/dao/ReplaceMassageDao.java#L74) |
| `SHIFTER.SHF_SECURITY_ACTIVITIES` | 1 | [SHF/src/bzq/shf/model/Login.java:242](../SHF/src/bzq/shf/model/Login.java#L242) |
| `SHIFTER.SHF_SECURITY_PROFILE` | 1 | [SHF/src/bzq/shf/model/Login.java:241](../SHF/src/bzq/shf/model/Login.java#L241) |
| `SHIFTER.SHF_SHIFT_CHANGE_ID` | 1 | [SHF/src/bzq/shf/model/ShiftDataModel.java:4619](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4619) |
| `SHIFTER.SHF_SHIFT_INFORCE_ID` | 1 | [SHF/src/bzq/shf/model/ShiftDataModel.java:2412](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2412) |
| `SHIFTER.SHF_SHIFT_INFORCE_INNER_JOB` | 3 | [SHF/src/bzq/shf/model/ShiftDataModel.java:2091](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2091); [SHF/src/bzq/shf/model/ShiftDataModel.java:2591](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2591); [SHF/src/bzq/shf/model/ShiftDataModel.java:2663](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2663) |
| `SHIFTER.SHF_SHIFT_INFORCE_REQ` | 10 | [SHF/src/bzq/shf/model/ShiftDataModel.java:1565](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1565); [SHF/src/bzq/shf/model/ShiftDataModel.java:1992](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1992); [SHF/src/bzq/shf/model/ShiftDataModel.java:2042](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2042); [SHF/src/bzq/shf/model/ShiftDataModel.java:2156](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2156) |
| `SHIFTER.SHF_SHIFT_INFORCE_TEAM` | 3 | [SHF/src/bzq/shf/model/ShiftDataModel.java:2068](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2068); [SHF/src/bzq/shf/model/ShiftDataModel.java:2557](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2557); [SHF/src/bzq/shf/model/ShiftDataModel.java:2662](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2662) |
| `SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE` | 9 | [SHF/src/bzq/shf/model/ReduceDataModel.java:129](../SHF/src/bzq/shf/model/ReduceDataModel.java#L129); [SHF/src/bzq/shf/model/ReduceDataModel.java:220](../SHF/src/bzq/shf/model/ReduceDataModel.java#L220); [SHF/src/bzq/shf/model/ReduceDataModel.java:315](../SHF/src/bzq/shf/model/ReduceDataModel.java#L315); [SHF/src/bzq/shf/model/ReduceDataModel.java:321](../SHF/src/bzq/shf/model/ReduceDataModel.java#L321) |
| `SHIFTER.SHF_SHIFT_REDUCE_REQ` | 7 | [SHF/src/bzq/shf/model/ReduceDataModel.java:128](../SHF/src/bzq/shf/model/ReduceDataModel.java#L128); [SHF/src/bzq/shf/model/ReduceDataModel.java:756](../SHF/src/bzq/shf/model/ReduceDataModel.java#L756); [SHF/src/bzq/shf/model/ReduceDataModel.java:76](../SHF/src/bzq/shf/model/ReduceDataModel.java#L76); [SHF/src/bzq/shf/model/ReduceDataModel.java:819](../SHF/src/bzq/shf/model/ReduceDataModel.java#L819) |
| `SHIFTER.SHF_SITE` | 1 | [SHF/src/bzq/shf/model/ForecastModel.java:3863](../SHF/src/bzq/shf/model/ForecastModel.java#L3863) |
| `SHIFTER.SHF_SKILLS` | 6 | [SHF/src/bzq/shf/dao/SkillDao.java:53](../SHF/src/bzq/shf/dao/SkillDao.java#L53); [SHF/src/bzq/shf/dao/SkillDao.java:78](../SHF/src/bzq/shf/dao/SkillDao.java#L78); [SHF/src/bzq/shf/model/EmployeeDataModel.java:244](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L244); [SHF/src/bzq/shf/model/LoadTables.java:242](../SHF/src/bzq/shf/model/LoadTables.java#L242) |
| `SHIFTER.SHF_SRR_ID_SEC` | 1 | [SHF/src/bzq/shf/model/ReduceDataModel.java:759](../SHF/src/bzq/shf/model/ReduceDataModel.java#L759) |
| `SHIFTER.SHF_SYSTEM_PARAM` | 1 | [SHF/src/bzq/shf/utils/ComplexCodeTable.java:78](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L78) |
| `SHIFTER.SHF_TIME_CHANGE_CANDIDATES` | 8 | [SHF/src/bzq/shf/model/ShiftDataModel.java:4679](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4679); [SHF/src/bzq/shf/model/ShiftDataModel.java:4969](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4969); [SHF/src/bzq/shf/model/ShiftDataModel.java:5089](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5089); [SHF/src/bzq/shf/model/ShiftDataModel.java:5215](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5215) |
| `SHIFTER.SHF_TIME_CHANGE_REQUEST` | 5 | [SHF/src/bzq/shf/model/ShiftDataModel.java:4613](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4613); [SHF/src/bzq/shf/model/ShiftDataModel.java:4680](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4680); [SHF/src/bzq/shf/model/ShiftDataModel.java:4747](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4747); [SHF/src/bzq/shf/model/ShiftDataModel.java:4836](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4836) |
| `SHIFTER.SHF_TIMEOFF_TYPES` | 1 | [SHF/src/bzq/shf/utils/ComplexCodeTable.java:28](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L28) |
| `SHIFTER.SHF_TRANSACTIONS` | 4 | [SHF/src/bzq/shf/model/BreakDataModel.java:3314](../SHF/src/bzq/shf/model/BreakDataModel.java#L3314); [SHF/src/bzq/shf/model/BreakDataModel.java:3358](../SHF/src/bzq/shf/model/BreakDataModel.java#L3358); [SHF/src/bzq/shf/model/ShiftDataModel.java:7483](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7483); [SHFEJB/ejbModule/ejbs/SHFSPMDBBean.java:182](../SHFEJB/ejbModule/ejbs/SHFSPMDBBean.java#L182) |
| `SHIFTER.SHF_TRANSACTIONS_ID` | 2 | [SHF/src/bzq/shf/model/ShiftDataModel.java:7489](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7489) |
| `SHIFTER.SHF_UNIT_PARAM` | 3 | [SHF/src/bzq/shf/model/SystemAdminModel.java:338](../SHF/src/bzq/shf/model/SystemAdminModel.java#L338); [SHF/src/bzq/shf/model/SystemAdminModel.java:376](../SHF/src/bzq/shf/model/SystemAdminModel.java#L376); [SHF/src/bzq/shf/utils/ComplexCodeTable.java:78](../SHF/src/bzq/shf/utils/ComplexCodeTable.java#L78) |
| `SHIFTER.SHF_USER_PROFILE` | 2 | [SHF/src/bzq/shf/model/Login.java:243](../SHF/src/bzq/shf/model/Login.java#L243); [SHF/src/bzq/shf/model/Login.java:247](../SHF/src/bzq/shf/model/Login.java#L247) |
| `SHIFTER.SHF_VIRTUAL_ACTIVITIES` | 3 | [SHF/src/bzq/shf/model/ForecastModel.java:1053](../SHF/src/bzq/shf/model/ForecastModel.java#L1053); [SHF/src/bzq/shf/model/ForecastModel.java:3681](../SHF/src/bzq/shf/model/ForecastModel.java#L3681); [SHF/src/bzq/shf/model/LoadTables.java:252](../SHF/src/bzq/shf/model/LoadTables.java#L252) |
| `WFM.WM_SCH_REPORT_ACTIVITIES` | 1 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:449](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L449) |

### 3.1 Unqualified SQL Object Candidates

Extracted from SQL-like FROM/JOIN/INTO/UPDATE fragments. Resolve each name against its actual connection, current schema, synonyms, and database links. A WM prefix alone does not establish its owner. Comma joins, split literals, comments, and dynamic SQL limit completeness.

| Unqualified candidate | Occurrences | Source references (first four) |
| --- | --- | --- |
| `SHF_ACTIVITY_CALL_TIME_AIM` | 1 | [SHF/src/bzq/shf/model/SystemAdminModel.java:547](../SHF/src/bzq/shf/model/SystemAdminModel.java#L547) |
| `SHF_BATCH_DOCS` | 2 | [SHFBatch/src/bzq/shf/batch/Process.java:113](../SHFBatch/src/bzq/shf/batch/Process.java#L113); [SHFBatch/src/bzq/shf/batch/Process.java:239](../SHFBatch/src/bzq/shf/batch/Process.java#L239) |
| `SHF_CATEGORY_JOB` | 1 | [SHF/src/bzq/shf/model/SystemAdminModel.java:831](../SHF/src/bzq/shf/model/SystemAdminModel.java#L831) |
| `SHF_DAY_CHANGES` | 1 | [SHF/src/bzq/shf/bean/BreakBean.java:28](../SHF/src/bzq/shf/bean/BreakBean.java#L28) |
| `SHF_DAY_DATA_FOR_BI` | 1 | [SHFBatch/src/bzq/shf/batch/ForcastDataProcess.java:484](../SHFBatch/src/bzq/shf/batch/ForcastDataProcess.java#L484) |
| `SHF_EMPLOYEE_DAY` | 1 | [SHF/src/bzq/shf/bean/BreakBean.java:30](../SHF/src/bzq/shf/bean/BreakBean.java#L30) |
| `SHF_EMPLOYEES` | 1 | [SHF/src/bzq/shf/bean/BreakBean.java:21](../SHF/src/bzq/shf/bean/BreakBean.java#L21) |
| `SHF_ORG_UNIT` | 1 | [SHF/src/bzq/shf/model/ShiftDataModel.java:1713](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1713) |
| `SHF_SHIFT_INFORCE_INNER_JOB` | 2 | [SHF/src/bzq/shf/model/ShiftDataModel.java:1915](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1915); [SHF/src/bzq/shf/model/ShiftDataModel.java:1919](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1919) |
| `SHF_SHIFT_INFORCE_TEAM` | 1 | [SHF/src/bzq/shf/model/ShiftDataModel.java:1862](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1862) |
| `WM_ACTIVITIES` | 5 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:178](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L178); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:216](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L216); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:218](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L218); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:268](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L268) |
| `WM_ACTIVITY_SKILLS` | 1 | [SHF/src/bzq/wfm/report/HRReportModel.java:160](../SHF/src/bzq/wfm/report/HRReportModel.java#L160) |
| `WM_AGENT_SKILLS` | 2 | [SHF/src/bzq/wfm/report/HRReportModel.java:161](../SHF/src/bzq/wfm/report/HRReportModel.java#L161); [SHF/src/bzq/wfm/report/HRReportModel.java:171](../SHF/src/bzq/wfm/report/HRReportModel.java#L171) |
| `WM_AGENTS` | 3 | [SHF/src/bzq/wfm/report/HRReportModel.java:161](../SHF/src/bzq/wfm/report/HRReportModel.java#L161); [SHF/src/bzq/wfm/report/HRReportModel.java:171](../SHF/src/bzq/wfm/report/HRReportModel.java#L171); [SHF/src/bzq/wfm/report/HRReportModel.java:173](../SHF/src/bzq/wfm/report/HRReportModel.java#L173) |
| `WM_CONTRACTS` | 1 | [SHF/src/bzq/wfm/report/HRReportModel.java:173](../SHF/src/bzq/wfm/report/HRReportModel.java#L173) |
| `WM_FORECAST_ACTIVITIES` | 1 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:267](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L267) |
| `WM_FORECAST_DATA` | 1 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:266](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L266) |
| `WM_FORECASTS` | 2 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:257](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L257); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:58](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L58) |
| `WM_SCH_ACTIVITIES` | 2 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:178](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L178); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:217](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L217) |
| `WM_SCH_SITES` | 2 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:154](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L154); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:477](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L477) |
| `WM_SCHEDULE_DAYS` | 1 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:103](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L103) |
| `WM_SCHEDULES` | 4 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:193](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L193); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:27](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L27); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:59](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L59); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:60](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L60) |
| `WM_SITES` | 2 | [SHF/src/bzq/wfm/report/ScheduleReportModel.java:154](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L154); [SHF/src/bzq/wfm/report/ScheduleReportModel.java:477](../SHF/src/bzq/wfm/report/ScheduleReportModel.java#L477) |

## 4. Public Model and Worker Method Index

A navigation aid, not a Java parser or a claim that every method is reachable. Multiline declarations can be missed. No bodies or sensitive payloads are exported.

| Source | Method |
| --- | --- |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L55) | `populateAttendance` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L194) | `saveReportRequirment` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L231) | `addEvent` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L256) | `addMissing` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L344) | `setFormDefaults` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L365) | `populateAttendanceList` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L947) | `addLate` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1013) | `addStageLate` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1053) | `registerStation` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1117) | `undoRegisterStage` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1155) | `checkReports` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1237) | `registerStage` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1305) | `getAgentDayExceptions` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1344) | `currentAgentDayFromChange` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1434) | `currentAgentDayFromDay` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1606) | `currentAgentDay` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1821) | `checkChangeAgentDay` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1884) | `exitStation` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1956) | `cancelLate` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L1994) | `cancelStageLate` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2032) | `cancelMissing` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2087) | `checkLock` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2209) | `cancelExitStation` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2249) | `cancelRegisterStation` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2300) | `removeFlag` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2333) | `cancelReport` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2363) | `approveReport` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2397) | `doFlag` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2445) | `populateApproveManager` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2515) | `getAllShiftBetween` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2584) | `setTadreech` |
| [SHF/src/bzq/shf/model/AttendanceDataModel.java](../SHF/src/bzq/shf/model/AttendanceDataModel.java#L2622) | `addEntryMood` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L77) | `setCurrentDefaults` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L102) | `getCurentTime` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L115) | `populateAllBreaksInRange` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L460) | `populateExceptionBreaks` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L615) | `populateBreaksForShift` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L680) | `exitToBreak` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L718) | `populateBreak` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L770) | `checkLate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L830) | `backFromBreak` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L872) | `moveBreaks` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L917) | `deleteInvalidBreaks` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L963) | `checkValidBreakCandidate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L990) | `checkIfBreakTooClose` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1002) | `checkIfBreakExist` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1051) | `checkBreakSource` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1105) | `checkIfAllowReplace` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1111) | `checkCandidate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1137) | `populateBreakCandidate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1251) | `populateBreakCandidatesByDayVec` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1308) | `checkGapBetweenBreaksAndShift` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1395) | `checkGapBetweenBreakCandidateAndShift` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1400) | `populateBreakOffer` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1524) | `insertBreakAsCandidate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1571) | `insertBreakAsCandidateOffer` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1621) | `updateBreakForChange` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1679) | `updateExceptionSource` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1722) | `populateCandidateForManage` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1740) | `populateCandidateForManageWithoutCaDetails` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1814) | `getBreakCandidateDetails` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1886) | `deleteBreakCandidate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L1920) | `rejectAllBreakOffer` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2010) | `rejectBreakOffer` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2050) | `cancelMyBreakOffer` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2090) | `switchBetweenBreaks` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2366) | `writeMassageForBreakVector` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2380) | `writeMassageForBreak` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2470) | `updateShiftBreaks` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2745) | `updateShiftBreaksManaged` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L2991) | `updateShiftBreaksCheckManaged` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3014) | `getTransBeanBase` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3037) | `sendTibcoQueueMsg` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3062) | `checkMessageResponse` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3129) | `filterInvalidResponses` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3158) | `updateManagedBreakIsOld` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3172) | `updateShiftBreaksManagedSendMessage` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3176) | `checkValidBreakRangeWithShift` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3202) | `checkBreakRange` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3220) | `checkShiftBreakForm` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3262) | `createMessageTransaction` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3309) | `updateTransaction` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3349) | `populateTransByIdVec` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3401) | `deleteAllBreaksFromCandidate` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3439) | `populateTabs` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3541) | `addBreak` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3571) | `getsCtx` |
| [SHF/src/bzq/shf/model/BreakDataModel.java](../SHF/src/bzq/shf/model/BreakDataModel.java#L3575) | `setsCtx` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L26) | `getBuildingForm` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L30) | `setBuildingForm` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L40) | `getAllBuildings` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L81) | `populateBuilding` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L116) | `addBuilding` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L145) | `updateBuilding` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L173) | `deleteBuilding` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L214) | `getTeamsBuildings` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L253) | `getBuildingsByMoked` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L287) | `getBuildingByTeam` |
| [SHF/src/bzq/shf/model/BuildingModel.java](../SHF/src/bzq/shf/model/BuildingModel.java#L318) | `updateTeamBuilding` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L56) | `setViewDefaults` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L67) | `getAllowedMoked` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L79) | `populateAddedByList` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L123) | `populate` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L141) | `populateSelectedCompletions` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L239) | `update` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L375) | `cancel` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L640) | `setAddDefaults` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L655) | `populateCompletionResult` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L959) | `saveCompletions` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L1092) | `getJobs` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L1136) | `assignJob` |
| [SHF/src/bzq/shf/model/CTICompletion.java](../SHF/src/bzq/shf/model/CTICompletion.java#L1157) | `unAssignJob` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L68) | `setActivitiesDefaults` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L90) | `populateActivities` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L239) | `populateSkills` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L285) | `populateCourses` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L291) | `populateEvents` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L303) | `populateTaxiOrders` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L587) | `populateEmployeeList` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L724) | `setFormDefaults` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L736) | `populate` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L774) | `populateByEmpIdNum` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L810) | `updateEmployeeParameters` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L866) | `populateAllEmployeeInforce` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L899) | `populateEployeeInforce` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1108) | `addEvent` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1164) | `cancelEvent` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1190) | `removeEvent` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1225) | `getMyId` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1265) | `lockEmployee` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1294) | `checkIfShiftAllowedForReplace` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1345) | `populateExceptions` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1431) | `getShiftsForSwitch` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1446) | `populateEmployeesByCompletions` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1491) | `populateEmployees` |
| [SHF/src/bzq/shf/model/EmployeeDataModel.java](../SHF/src/bzq/shf/model/EmployeeDataModel.java#L1537) | `updateSMS` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L54) | `deleteException` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L62) | `deleteFullDayException` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L75) | `validateCancelException` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L94) | `cancelDayParts` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L112) | `cancelException` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L150) | `cancelExceptionForcedSwitch` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L181) | `isShiftContainsExceptions` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L210) | `isShiftContainsExceptionsNoSplit` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L243) | `populateExcepByDayVec` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L300) | `setFormDefaults` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L311) | `populateAllExceptions` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L327) | `populateUserExceptionsNoBreaks` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L373) | `populateFullDayExceptions` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L504) | `populateExceptionsList` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L642) | `populateTimeoffDays` |
| [SHF/src/bzq/shf/model/ExceptionDataModel.java](../SHF/src/bzq/shf/model/ExceptionDataModel.java#L771) | `addRemark` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L64) | `setDefault` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L114) | `populateCallForecast` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L241) | `sumData` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L563) | `getTimeString` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L1098) | `populateLocalActivities` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L1218) | `populateLocalActivities` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L1252) | `populateSchedualForecast` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L3667) | `setActivityFromVirtual` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L3721) | `setActivityForSelect` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L3780) | `setExceptionForSelect` |
| [SHF/src/bzq/shf/model/ForecastModel.java](../SHF/src/bzq/shf/model/ForecastModel.java#L3837) | `sumSchData` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L40) | `getEmpAndModules` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L173) | `getEmpAndModulesSelect` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L302) | `getAllModules` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L334) | `doSchedule` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L390) | `compare` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L577) | `doScheduleCancel` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L670) | `insertToPeleEmpHistory` |
| [SHF/src/bzq/shf/model/IWDModel.java](../SHF/src/bzq/shf/model/IWDModel.java#L708) | `setFormDefaults` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L55) | `load` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L105) | `loadTimeoffTypes` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L118) | `loadInnerJobs` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L130) | `loadCompletions` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L142) | `loadExceptions` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L155) | `loadMobileAuditRef` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L162) | `loadParameters` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L171) | `loadSiteUnitTable` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L180) | `loadOrgUnit` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L201) | `loadJobs` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L214) | `loadActivities` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L227) | `loadEventReasons` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L239) | `loadSkills` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L249) | `loadVirtualActivities` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L259) | `callUrl` |
| [SHF/src/bzq/shf/model/LoadTables.java](../SHF/src/bzq/shf/model/LoadTables.java#L288) | `loadCategoryJobTable` |
| [SHF/src/bzq/shf/model/Login.java](../SHF/src/bzq/shf/model/Login.java#L38) | `load` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L46) | `getAllMessage` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L69) | `getEmpId` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L104) | `updateMessagesToDeleted` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L192) | `acceptOffer` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L282) | `isOfferRelevant` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L321) | `getsCtx` |
| [SHF/src/bzq/shf/model/MessageModel.java](../SHF/src/bzq/shf/model/MessageModel.java#L325) | `setsCtx` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L51) | `getAllowedMokedOrSingle` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L83) | `populateByUnitCodeVec` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L137) | `updateOptSHFSPFlag` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L432) | `delByOrgUnitCodeVec` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L472) | `updateByFalseTrueVec` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L557) | `getForm` |
| [SHF/src/bzq/shf/model/OptShfSpModel.java](../SHF/src/bzq/shf/model/OptShfSpModel.java#L561) | `setForm` |
| [SHF/src/bzq/shf/model/PlatformModel.java](../SHF/src/bzq/shf/model/PlatformModel.java#L31) | `insertMobileAudit` |
| [SHF/src/bzq/shf/model/PlatformModel.java](../SHF/src/bzq/shf/model/PlatformModel.java#L69) | `populateUsageList` |
| [SHF/src/bzq/shf/model/PlatformModel.java](../SHF/src/bzq/shf/model/PlatformModel.java#L159) | `setFormDefaults` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L47) | `setRequestCurrentDefaults` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L60) | `setRequestInsertDefaults` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L68) | `populateReduceRequest` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L120) | `populateAddRequestReduce` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L164) | `populateToReduce` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L281) | `searchReduceOptions` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L387) | `checkTimeForReduceShift` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L404) | `checkIfAllowedCancelShiftForReduce` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L415) | `cancelShiftForReduce` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L481) | `addReduceCandidate` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L535) | `declineReduce` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L579) | `writeMassageForReduce` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L617) | `getSumApprovedReduceRequest` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L669) | `getAllNotApprovedCandidate` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L726) | `addReduceReq` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L808) | `getReduceForUpdateOrView` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L859) | `deleteReduceReq` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L904) | `updateReduceReq` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L979) | `updateReduceReqNumOfAgent` |
| [SHF/src/bzq/shf/model/ReduceDataModel.java](../SHF/src/bzq/shf/model/ReduceDataModel.java#L1025) | `declineAllNotApproved` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L76) | `SearchCandidateForReplacement` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L133) | `getShiftsInReplaceRepository` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L146) | `offerReplaceToCandidate` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L224) | `offerReplaceToMulitpleCandidates` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L456) | `cancelReplaceToCandidate` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L492) | `rejectReplaceOffer` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L551) | `checkGapBetweenShifts` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L570) | `acceptReplaceOffer` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L610) | `buildMassages` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L627) | `buildMassages` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L670) | `cancelShiftReplace` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L760) | `lookForOffers` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L773) | `lookForOffers` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L867) | `insertShiftToRepository` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L880) | `findSuitableCandidates` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L928) | `isExistInRepository` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L941) | `checkValidShiftCandidate` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L991) | `checkShiftsForSwitch` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L1134) | `getMaxOffersForShiftReplace` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L1197) | `getsCtx` |
| [SHF/src/bzq/shf/model/ReplaceModel.java](../SHF/src/bzq/shf/model/ReplaceModel.java#L1202) | `setsCtx` |
| [SHF/src/bzq/shf/model/ShiftCancelledModel.java](../SHF/src/bzq/shf/model/ShiftCancelledModel.java#L30) | `setCurrentDefaults` |
| [SHF/src/bzq/shf/model/ShiftCancelledModel.java](../SHF/src/bzq/shf/model/ShiftCancelledModel.java#L42) | `populateCancelled` |
| [SHF/src/bzq/shf/model/ShiftCancelledModel.java](../SHF/src/bzq/shf/model/ShiftCancelledModel.java#L55) | `populateShiftCancelledList` |
| [SHF/src/bzq/shf/model/ShiftCancelledModel.java](../SHF/src/bzq/shf/model/ShiftCancelledModel.java#L246) | `populateCancelledFullDayExceptions` |
| [SHF/src/bzq/shf/model/ShiftCancelledModel.java](../SHF/src/bzq/shf/model/ShiftCancelledModel.java#L424) | `populateCancelledEmployeeExceptions` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L150) | `populateShift` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L241) | `delFromChangesByDayId` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L277) | `setFormDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L296) | `setCurrentDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L307) | `setChangeShiftDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L320) | `populateShiftList` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L924) | `populateCurrentShift` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L933) | `getCurrentShifts` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1166) | `populateMyShifts` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1393) | `doAction` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L1965) | `populateShiftAddRequests` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2036) | `deleteShiftAddRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2062) | `deleteShiftAddRequestTeam` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2085) | `deleteShiftAddRequestInnerJob` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2224) | `updateShiftAddRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2317) | `updateShiftAddRequestNum` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2383) | `addShiftAddRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2408) | `findNextVal` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2428) | `insertInforceReq` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2548) | `insertInforceTeam` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2583) | `insertInforceInnerJob` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2618) | `searchAddOptions` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2625) | `getAddOptions` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2716) | `shiftChangeInsert` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2954) | `changeShiftSource` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L2968) | `shiftChangeUpdate` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3117) | `populateShiftForUpdate` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3213) | `checkIfInsert` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3253) | `addShift` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3380) | `setAddInforceDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3401) | `setAddInforceFromPotentialDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3408) | `setSearchInforceOptionDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3514) | `fixBreaks` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3604) | `validateUpdate` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3704) | `cancelShift` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L3969) | `upsertShift` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4243) | `updateShiftLocation` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4315) | `checkShiftForCancel` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4330) | `checkIfEntryMade` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4369) | `getShiftsWithEntryToday` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4415) | `checkIfSwitchShiftMade` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4452) | `checkIfSwitchBreakMade` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4492) | `setShiftChangeFormDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4524) | `validateChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4576) | `addShiftChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4674) | `populateShiftChangeRequests` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4745) | `updateApprovedShiftChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4788) | `updateShiftChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L4919) | `populateChangeRequestOptions` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5040) | `populateChangeRequestOptionsForAgent` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5167) | `populateChangeRequestApplications` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5256) | `populateChangeRequestOfAgent` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5269) | `updateAgentDayTime` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5387) | `setAgentDayTimeByChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5424) | `updateCandidateToChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5492) | `rejectCandidate` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5559) | `sendChangeRequestMessages` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5594) | `deleteShiftChangeRequest` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5599) | `rejectAllUnApproved` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5643) | `deleteFromRepositories` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5664) | `saveRemark` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L5801) | `addSingleShift` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6166) | `setAddSingleShiftDefaults` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6189) | `getPotentialInforce` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6255) | `getUserPotentailForInforce` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6918) | `getSelectedPotential` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L6988) | `prapreSingleShiftData` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7009) | `checkPoolExtensionAllocated` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7018) | `populateManagerLoginCancel` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7073) | `addLoginCancelEvent` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7119) | `getDirectManagerMail` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7126) | `getEmployeeMail` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7159) | `getManagerId` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7192) | `poolExtAllocRelease` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7265) | `resetPoolExtension` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7315) | `processPoolPopulation` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7454) | `getPoolSeqNextVal` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7474) | `updateDataAfterHttpReq` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7593) | `AddShiftsFromFile` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L7934) | `validateAddShiftsFormFile` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L8020) | `getsCtx` |
| [SHF/src/bzq/shf/model/ShiftDataModel.java](../SHF/src/bzq/shf/model/ShiftDataModel.java#L8023) | `setsCtx` |
| [SHF/src/bzq/shf/model/SoftPhoneModel.java](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L40) | `updateTimeActual` |
| [SHF/src/bzq/shf/model/SoftPhoneModel.java](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L123) | `insertBreakSMS` |
| [SHF/src/bzq/shf/model/SoftPhoneModel.java](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L170) | `logout` |
| [SHF/src/bzq/shf/model/SoftPhoneModel.java](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L177) | `getForm` |
| [SHF/src/bzq/shf/model/SoftPhoneModel.java](../SHF/src/bzq/shf/model/SoftPhoneModel.java#L181) | `setForm` |
| [SHF/src/bzq/shf/model/SwitchModel.java](../SHF/src/bzq/shf/model/SwitchModel.java#L69) | `validateReplace` |
| [SHF/src/bzq/shf/model/SwitchModel.java](../SHF/src/bzq/shf/model/SwitchModel.java#L195) | `removeLimit` |
| [SHF/src/bzq/shf/model/SwitchModel.java](../SHF/src/bzq/shf/model/SwitchModel.java#L294) | `replaceDays` |
| [SHF/src/bzq/shf/model/SwitchModel.java](../SHF/src/bzq/shf/model/SwitchModel.java#L710) | `checkFirst` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L143) | `viewSystemParameters` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L184) | `saveParameters` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L431) | `populateSkill` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L461) | `populateActivity` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L506) | `activityList` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L569) | `saveActivityAim` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L597) | `insertActivityAim` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L634) | `deleteActivityAim` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L661) | `updateSkill` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L686) | `addInnerJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L711) | `updateInnerJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L739) | `deleteInnerJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L770) | `actualJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L774) | `populateCategoryJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L812) | `updateCategoryJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L827) | `findActualJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L857) | `insertActualJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L886) | `updateActualJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L908) | `deleteActualJob` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L932) | `getInnerJobsGroups` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L956) | `setMaxSelectForSwitchOffer` |
| [SHF/src/bzq/shf/model/SystemAdminModel.java](../SHF/src/bzq/shf/model/SystemAdminModel.java#L959) | `getMaxSelectForSwitchOffer` |
| [SHF/src/bzq/shf/servletListenersTasks/BaseTask.java](../SHF/src/bzq/shf/servletListenersTasks/BaseTask.java#L9) | `getServCtx` |
| [SHF/src/bzq/shf/servletListenersTasks/BaseTask.java](../SHF/src/bzq/shf/servletListenersTasks/BaseTask.java#L13) | `setServCtx` |
| [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L42) | `run` |
| [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L360) | `setIwdServiceField` |
| [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L382) | `getServCtx` |
| [SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java](../SHF/src/bzq/shf/servletListenersTasks/IwdScheduledSenderTask.java#L386) | `setServCtx` |
| [SHF/src/bzq/shf/servletListenersTasks/PoolExtensionAllocationTask.java](../SHF/src/bzq/shf/servletListenersTasks/PoolExtensionAllocationTask.java#L21) | `run` |
| [SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java](../SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java#L30) | `run` |
| [SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java](../SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java#L155) | `getServCtx` |
| [SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java](../SHF/src/bzq/shf/servletListenersTasks/SMSBreakEndReminderTask.java#L159) | `setServCtx` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L73) | `execute` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L125) | `getDbAccess` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L133) | `getFileStack` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L291) | `perform` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L364) | `geNextDocKeyValue` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L384) | `getLastRunDate` |
| [SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java](../SHFBatch/src/bzq/shf/batch/BaseBatchProcess.java#L408) | `loadSystemParam` |
| [SHFBatch/src/bzq/shf/batch/BatchLoadTables.java](../SHFBatch/src/bzq/shf/batch/BatchLoadTables.java#L64) | `main` |
| [SHFBatch/src/bzq/shf/batch/BatchLoadTables.java](../SHFBatch/src/bzq/shf/batch/BatchLoadTables.java#L98) | `execute` |
| [SHFBatch/src/bzq/shf/batch/BatchProcessInitializer.java](../SHFBatch/src/bzq/shf/batch/BatchProcessInitializer.java#L22) | `getProcessBean` |
| [SHFBatch/src/bzq/shf/batch/BatchProcessInitializer.java](../SHFBatch/src/bzq/shf/batch/BatchProcessInitializer.java#L43) | `setProcessBean` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L52) | `main` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L71) | `execute` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L636) | `getAllDuplicateRecs` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L679) | `getAllCtiRecordsToProcess` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1.java#L751) | `getEndTimeToProcess` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L52) | `main` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L71) | `execute` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L636) | `getAllDuplicateRecs` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L679) | `getAllCtiRecordsToProcess` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java](../SHFBatch/src/bzq/shf/batch/CTIProcess1Copy.java#L751) | `getEndTimeToProcess` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess2.java](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L51) | `main` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess2.java](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L69) | `execute` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess2.java](../SHFBatch/src/bzq/shf/batch/CTIProcess2.java#L406) | `geNextCtiShiftKeyValue` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess3.java](../SHFBatch/src/bzq/shf/batch/CTIProcess3.java#L65) | `main` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess3.java](../SHFBatch/src/bzq/shf/batch/CTIProcess3.java#L83) | `execute` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess4.java](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L81) | `main` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess4.java](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L99) | `execute` |
| [SHFBatch/src/bzq/shf/batch/CTIProcess4.java](../SHFBatch/src/bzq/shf/batch/CTIProcess4.java#L1076) | `writeFile` |
| [SHFBatch/src/bzq/shf/batch/ForcastDataProcess.java](../SHFBatch/src/bzq/shf/batch/ForcastDataProcess.java#L74) | `main` |
| [SHFBatch/src/bzq/shf/batch/ForcastDataProcess.java](../SHFBatch/src/bzq/shf/batch/ForcastDataProcess.java#L92) | `execute` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L40) | `erase` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L70) | `get` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L110) | `getExecDate` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L128) | `getFileName` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L146) | `getFirstReadyProcessRow` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L182) | `getLastCompleteGenNumber` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L205) | `getLastCompleteGenNumber` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L233) | `getLastCompleteGenNumber` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L255) | `getLastCompleteGenNumber` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L283) | `getMaxCompleteExecDate` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L308) | `getLastCompleteProcessRow` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L345) | `getProcessStatus` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L364) | `getRecordsAdded` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L382) | `getRecordsDeleted` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L405) | `getRecordsInvalid` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L423) | `getRecordsModified` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L443) | `getLastProcesses` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L497) | `getRecordsScanned` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L519) | `getRows` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L549) | `getTriggerDate` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L568) | `ifHasReadyProcess` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L596) | `ifHasReadyProcess` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L620) | `initRowBatchDocBean` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L640) | `initRowBatchDocBean` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L673) | `setDocDesc` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L689) | `setExecDate` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L705) | `setFileName` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L721) | `setGenNumber` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L738) | `setProcessStatus` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L757) | `setRecords` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L786) | `setRecordsAdded` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L803) | `setRecordsDeleted` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L818) | `setRecordsInvalid` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L835) | `setRecordsModified` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L851) | `setRecordsScanned` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L865) | `update` |
| [SHFBatch/src/bzq/shf/batch/Process.java](../SHFBatch/src/bzq/shf/batch/Process.java#L886) | `validateAddProcess` |
| [SHFBatch/src/bzq/shf/batch/ShfBatchConstants.java](../SHFBatch/src/bzq/shf/batch/ShfBatchConstants.java#L109) | `getAgafCodeOf` |
| [SHFBatch/src/bzq/shf/batch/ShfBatchConstants.java](../SHFBatch/src/bzq/shf/batch/ShfBatchConstants.java#L126) | `getUnitByCode` |

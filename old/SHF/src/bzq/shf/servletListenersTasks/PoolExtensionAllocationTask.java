package bzq.shf.servletListenersTasks;

import java.util.Calendar;
import java.util.Vector;

import org.apache.log4j.Logger;
import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;

public class PoolExtensionAllocationTask extends BaseTask implements Runnable {

	private static Logger logger = Logger.getLogger(PoolExtensionAllocationTask.class);

	public void run() {
		try {
			Calendar now = Calendar.getInstance();
//			now.add(Calendar.HOUR, 1);
			
			Calendar start = (Calendar)now.clone();
			start.add(Calendar.HOUR, -2);

			Calendar end = (Calendar)now.clone();
			end.add(Calendar.HOUR, 2);
			
			StringBuffer sql = new StringBuffer();
			sql.append("(SELECT D.*,  "); 
			sql.append("NULL          AS NEW_ACTIVITY, "); 
			sql.append("NULL          AS NEW_DAY_END,  ");
			sql.append("NULL          AS NEW_DAY_START,  "); 
			sql.append("NULL          AS NEW_DAY_TYPE,  "); 
			sql.append("NULL          AS NEW_EMPLOYEE_ID,  "); 
			sql.append("NULL          AS NEW_EXCEPTION_TYPE_ID,  "); 
			sql.append("NULL          AS NEW_PAID_MINUTES,  "); 
			sql.append("NULL          AS NEW_SHIFT_END,  "); 
			sql.append("NULL          AS NEW_SHIFT_START,  "); 
			sql.append("NULL          AS NEW_SITE_ID,  "); 
			sql.append("NULL          AS NEW_TIMEOFF_TYPE_ID, "); 
			sql.append("NULL          AS NEW_WORK_MINUTES,  "); 
			sql.append("NULL          AS START_CHANGE_REASON,  "); 
			sql.append("NULL          AS END_CHANGE_REASON,  "); 
			sql.append("NULL          AS SWITCH_DAY_ID,  "); 
			sql.append("NULL          AS MODIFICATION_TIME,  "); 
			sql.append("NULL          AS MODIFICATION_USER,  "); 
			sql.append("NULL          AS NEW_WORK_FROM_HOME,  "); 
			sql.append("NULL          AS NEW_SPLIT_SHIFT,  "); 
			sql.append("NULL          AS NEW_SPLIT_START,  "); 
			sql.append("NULL          AS NEW_SPLIT_END,  "); 
			sql.append("NULL		  AS new_pool_ext_num, ");
			sql.append("NULL		  AS new_pool_err, ");
			sql.append("A.stage_arrival_time,   "); 
			sql.append("A.station_arrival_time,   "); 
			sql.append("A.stage_arrival_user,   "); 
			sql.append("A.station_arrival_user,   "); 
			sql.append("A.late_minutes,   "); 
			sql.append("A.late_reason_id,   "); 
			sql.append("A.miss_reason_id,   "); 
			sql.append("A.missing_time,   "); 
			sql.append("A.missing_remark,   "); 
			sql.append("A.late_remark,   "); 
			sql.append("A.station_exit_time,   "); 
			sql.append("A.station_exit_user,   "); 
			sql.append("a.stage_late_minutes,   "); 
			sql.append("a.stage_late_reason_id,   "); 
			sql.append("a.stage_late_remark,   "); 
			sql.append("a.optional1,   "); 
			sql.append("a.tadreech,   "); 
			sql.append("E.employee_id,   "); 
			sql.append("E.last_name,   "); 
			sql.append("E.first_name,   "); 
			sql.append("E.inner_job_id,   "); 
			sql.append("E.job_id,   "); 
			sql.append("E.org_unit_id,   "); 
			sql.append("E.employee_id AS EMPLOYEE_ID_OLD,  "); 
			sql.append("E.last_name   AS LAST_NAME_OLD,   "); 
			sql.append("E.first_name  AS FIRST_NAME_OLD,   "); 
			sql.append("E.cellular_phone,   ");
			sql.append("l.applier_name,   "); 
			sql.append("l.updater_name,   "); 
			sql.append("l.cancel_login_remark  ");  
			sql.append("FROM   shifter.shf_employees E,   "); 
			sql.append("shifter.shf_org_unit U,   "); 
			sql.append("shifter.shf_employee_day D   "); 
			sql.append("LEFT JOIN shifter.shf_attendance A  ");  
			sql.append("ON D.shf_employee_day_id = A.shf_employee_day_id  "); 
			sql.append("LEFT JOIN shifter.shf_cti_cancel_login_shifts l   "); 
			sql.append("ON d.shf_employee_day_id = l.shf_employee_day_id  "); 
			sql.append("WHERE  E.employee_id IS NOT NULL   "); 
			sql.append("AND Substr(E.emp_id_number, 1, 8) = D.emp_id_number  ");  
			sql.append("AND U.org_unit_id = E.org_unit_id  "); 
			sql.append("AND D.wm_day_type = ?  ");		// 1
			sql.append("AND ((D.wm_shift_start_datetime BETWEEN ? AND ? ) ");	// 2, 3 
			sql.append("OR (D.wm_shift_end_datetime BETWEEN ? AND ? ) "); 		// 4, 5 
			sql.append(") ");                
			sql.append("AND D.shf_employee_day_id IN (SELECT D.shf_employee_day_id ");  
			sql.append("FROM   shifter.shf_employee_day D  "); 
			sql.append("minus ");  
			sql.append("SELECT C.shf_employee_day_id ");  
			sql.append("FROM   shifter.shf_day_changes C)  "); 
//			sql.append("AND d.pool_ext_num IS NULL  ");
			sql.append("And d.work_from_home = 'Y' "); 
			sql.append(") ");  
			
			sql.append("UNION ");  
			
			sql.append("(SELECT D.*, ");  
			sql.append("C.new_activity, ");  
			sql.append("C.new_day_end,  "); 
			sql.append("C.new_day_start, ");  
			sql.append("C.new_day_type, ");  
			sql.append("C.new_employee_id, ");  
			sql.append("C.new_exception_type_id, ");  
			sql.append("C.new_paid_minutes, ");  
			sql.append("C.new_shift_end, ");  
			sql.append("C.new_shift_start, ");  
			sql.append("C.new_site_id, "); 
			sql.append("C.new_timeoff_type_id, "); 
			sql.append("C.new_work_minutes, "); 
			sql.append("C.start_change_reason, "); 
			sql.append("C.end_change_reason, "); 
			sql.append("C.switch_day_id, "); 
			sql.append("C.modification_time,  ");
			sql.append("C.modification_user, "); 
			sql.append("C.new_work_from_home, ");
			sql.append("C.new_split_shift,  ");
			sql.append("C.new_split_start,  ");
			sql.append("C.new_split_end, ");
			sql.append("C.new_pool_ext_num,   "); 
			sql.append("C.new_pool_err, ");
			sql.append("A.stage_arrival_time, "); 
			sql.append("A.station_arrival_time, "); 
			sql.append("A.stage_arrival_user, "); 
			sql.append("A.station_arrival_user, "); 
			sql.append("A.late_minutes, "); 
			sql.append("A.late_reason_id, "); 
			sql.append("A.miss_reason_id, "); 
			sql.append("A.missing_time, "); 
			sql.append("A.missing_remark, "); 
			sql.append("A.late_remark, "); 
			sql.append("A.station_exit_time, "); 
			sql.append("A.station_exit_user,  ");
			sql.append("a.stage_late_minutes,  ");
			sql.append("a.stage_late_reason_id, "); 
			sql.append("a.stage_late_remark,  ");
			sql.append("a.optional1,  ");
			sql.append("a.tadreech,  ");
			sql.append("E.employee_id,  ");
			sql.append("E.last_name,  ");
			sql.append("E.first_name,  ");
			sql.append("E.inner_job_id,  ");
			sql.append("E.job_id,  ");
			sql.append("E.org_unit_id, "); 
			sql.append("E_OLD.employee_id AS EMPLOYEE_ID_OLD, "); 
			sql.append("E_OLD.last_name   AS LAST_NAME_OLD, "); 
			sql.append("E_OLD.first_name  AS FIRST_NAME_OLD, "); 
			sql.append("E.cellular_phone, ");
			sql.append("l.applier_name, "); 
			sql.append("l.updater_name, "); 
			sql.append("l.cancel_login_remark "); 
			sql.append("FROM   shifter.shf_employees E, "); 
			sql.append("shifter.shf_employees E_OLD,  ");
			sql.append("shifter.shf_org_unit U, "); 
			sql.append("shifter.shf_employee_day D,  ");
			sql.append("shifter.shf_day_changes C "); 
			sql.append("LEFT JOIN shifter.shf_attendance A "); 
			sql.append("ON C.shf_employee_day_id = A.shf_employee_day_id "); 
			sql.append("LEFT JOIN shifter.shf_cti_cancel_login_shifts l "); 
			sql.append("ON C.shf_employee_day_id = l.shf_employee_day_id "); 
			sql.append("WHERE  E.employee_id IS NOT NULL "); 
			sql.append("AND D.shf_employee_day_id = C.shf_employee_day_id "); 
			sql.append("AND Substr(E.emp_id_number, 1, 8) = C.new_employee_id  ");
			sql.append("AND Substr(E_OLD.emp_id_number, 1, 8) = D.emp_id_number "); 
			sql.append("AND U.org_unit_id = E.org_unit_id "); 
			sql.append("AND C.new_day_type = ? ");		// 6 
			sql.append("AND ( (C.new_shift_start BETWEEN ? AND ? ) ");	// 7, 8
			sql.append("OR (C.New_Shift_End BETWEEN ? AND ?) ");		// 9, 10
			sql.append(") ");
//			sql.append("AND c.pool_ext_num IS NULL ");
			sql.append("AND c.new_work_from_home = 'Y' ");
			sql.append(")  ");
			
			Vector<AgentDayBean> genList = new Vector<AgentDayBean>();
			DBAccess db = null;
			try {
				int index = 1;
				db = new DBAccess();
				
				db.prepareStatement(sql.toString());				
				db.setInt(index++, SHFConstants.DAY_TYPE_ACTIVITY); // 1
				db.setTimestamp(index++, start.getTime());	// 2
				db.setTimestamp(index++, end.getTime()); // 3
				db.setTimestamp(index++, start.getTime());	// 4
				db.setTimestamp(index++, end.getTime()); // 5
				db.setInt(index++, SHFConstants.DAY_TYPE_ACTIVITY); // 6
				db.setTimestamp(index++, start.getTime());	// 7
				db.setTimestamp(index++, end.getTime()); // 8
				db.setTimestamp(index++, start.getTime());	// 9
				db.setTimestamp(index++, end.getTime()); // 10
				
				db.executeQuery();				
				db.populate("bzq.shf.bean.AgentDayBean", genList);
				
				if (genList.size() > 0) {
					
					Vector<AgentDayBean> allocateBeforeShiftStart = new Vector<AgentDayBean>();
					Vector<AgentDayBean> releaseAfterShiftEnd = new Vector<AgentDayBean>();
					Vector<AgentDayBean> releaseNoArrival = new Vector<AgentDayBean>();
					
					for (AgentDayBean agentDayBean : genList) {
						
						String mokedOrgUnitId = SHFTableUtils.getMokedCodeOf(agentDayBean.getOrgUnitCode());
						String poolEnabledStr = SHFParameters.getPoolEnabled(mokedOrgUnitId).getValue();
						Boolean poolEnabled = false;
						 
						try {
							poolEnabled = Boolean.valueOf(poolEnabledStr);
						} catch (Exception e) {
							e.printStackTrace();
							poolEnabled = false;
						}
						
						System.out.println("mokedOrgUnitId : " + mokedOrgUnitId + ", poolEnabled : " + poolEnabledStr);
						
						if (poolEnabled) {	// if extension allocation is enabled for agent
							String timeBeforeShiftStart = SHFParameters.getPoolExtAllocateTimeBeforeShiftStart(mokedOrgUnitId).getValue();
							String timeAfterShiftEnd = SHFParameters.getPoolExtReturnTimeAfterShiftEnd(mokedOrgUnitId).getValue();
							String timeReleaseNoArrival = SHFParameters.getPoolExtReturnTimeNoArrival(mokedOrgUnitId).getValue();
							
							Calendar shiftStart = Calendar.getInstance();
							shiftStart.setTime(agentDayBean.getShiftStart());
							Calendar shiftStartWithParamBeforeStart = (Calendar)shiftStart.clone();
							shiftStartWithParamBeforeStart.add(Calendar.MINUTE, -(Integer.parseInt(timeBeforeShiftStart)));
							Calendar shiftStartWithParamNoArrival = (Calendar)shiftStart.clone();
							shiftStartWithParamNoArrival.add(Calendar.MINUTE, (Integer.parseInt(timeReleaseNoArrival)));
							
							Calendar shiftEnd = Calendar.getInstance();
							shiftEnd.setTime(agentDayBean.getShiftEnd());
							Calendar shiftEndWithParamAfterEnd = (Calendar)shiftEnd.clone();
							shiftEndWithParamAfterEnd.add(Calendar.MINUTE, (Integer.parseInt(timeAfterShiftEnd)));
							
							if ( (!now.before(shiftStartWithParamBeforeStart) && !now.after(shiftStart)) &&  agentDayBean.getShiftExtNum() == null) {		// check timeBeforeShiftStart (now is between shiftStart and (shiftStart - timeBeforeShiftStart) and extension not allocated)
								agentDayBean.setPoolRequestType(1);
								allocateBeforeShiftStart.add(agentDayBean);
								
							} else if (now.after(shiftEndWithParamAfterEnd) && agentDayBean.getShiftExtNum() != null){			// check timeAfterShiftEnd (now is after (shiftEnd + timeAfterShiftEnd) and extension is allocated)
								agentDayBean.setPoolRequestType(2);
								releaseAfterShiftEnd.add(agentDayBean);

							} else if (now.after(shiftStartWithParamNoArrival) && agentDayBean.getShiftExtNum() != null && (agentDayBean.getStageArrivalTime() == null || agentDayBean.getStationArrivalTime() == null)){			// check timeReleaseNoArrival	(now is after (shiftStart + timeReleaseNoArrival) and extension is allocated and NO agent arrival (stage or station) )
								agentDayBean.setPoolRequestType(2);
								releaseNoArrival.add(agentDayBean);
								
							} else {				// unknown
								System.out.println("Unknown condition for POOL extension allocation, shift id : " + agentDayBean.getAgentDayId());
							}
						}
					}
					
					ShiftDataModel shiftsModel = new ShiftDataModel();
					shiftsModel.setsCtx(getServCtx());
					
					if (allocateBeforeShiftStart.size() > 0) {
						shiftsModel.processPoolPopulation(allocateBeforeShiftStart, db);
					}
					
					if (releaseAfterShiftEnd.size() > 0) {
						shiftsModel.processPoolPopulation(releaseAfterShiftEnd, db);
					}
					
					if (releaseNoArrival.size() > 0) {
						shiftsModel.processPoolPopulation(releaseNoArrival, db);
					}
					
				} else {
					logger.info("No relevant population found for pool extension allocation");
				}
				
			} catch(DBQueryNoRowsException e){
				
			} catch (Exception e) {
				logger.error("Database error while performing task " + this.getClass().getSimpleName() + " : " + e.getMessage(), e);
			} finally{
				try {
					db.close();
				} catch (DBException e) {
					throw new ShfException("db.close()", e);
				}
			}
			
		} catch (Throwable  t) {	// "Throwable" since we must catch errors also
			try {
				logger.error("Error while performing task " + this.getClass().getSimpleName() + " : " + t.getMessage(), t);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

}

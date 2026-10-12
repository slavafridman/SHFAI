package bzq.shf.model;

import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.PeleIWDBean;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.PeleIWDForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;


public class IWDModel {
	
	private static Logger logger = Logger.getLogger(IWDModel.class);
	PeleIWDForm IWDForm = null;
	
	public IWDModel () {
		super();
	}
	
	public IWDModel (PeleIWDForm IWDForm) {
		this.IWDForm = IWDForm;
	}
	
	public Vector<PeleIWDBean> getEmpAndModules (Vector<PeleIWDBean> empAndModulesParam) throws ShfException {
		logger.debug("Starting getEmpAndModules()");
		
		Vector<PeleIWDBean> result = null;		
		Vector<PeleIWDBean> empAndModules = (empAndModulesParam == null || empAndModulesParam.size() == 0 ) ? getEmpAndModulesSelect() : empAndModulesParam;		
		Vector<PeleIWDBean> empAndModulesAgaf = new Vector<PeleIWDBean>();
		
		if (empAndModules != null && empAndModules.size() > 0) {
			for (PeleIWDBean dbResult : empAndModules) {
				if (SHFTableUtils.getAgafCodeOf(dbResult.getOrgUnitId()).equals(IWDForm.getAgaf())) {
					empAndModulesAgaf.add(dbResult);
				}
			}
		}
		
		if (empAndModulesAgaf.size() > 0) {
			result = new Vector<PeleIWDBean>();
			Calendar now = Calendar.getInstance();
			
			for (PeleIWDBean dbResult : empAndModulesAgaf) {
					
				boolean found = false;
				
				int minsBeforeShiftEnd = 20;	// minutes
				int defaultTimeToComplete = 5;	// minutes
				int timeToComplete = dbResult.getModuleTimeToComplete() > 0 ? dbResult.getModuleTimeToComplete() : defaultTimeToComplete;
				Calendar ShiftEndCalc = Calendar.getInstance();
				if (dbResult.getShiftEnd() != null) {
					ShiftEndCalc.setTime(dbResult.getShiftEnd());
					ShiftEndCalc.add(Calendar.MINUTE, -(minsBeforeShiftEnd + timeToComplete));	
				}
				
				for (PeleIWDBean resultBean : result) {
					if (dbResult.getModuleId() == resultBean.getModuleId() 
							&& dbResult.getParentId().equals(resultBean.getParentId())
							&& dbResult.getInnerJobId() == resultBean.getInnerJobId()) {
						
						found = true;
						
						resultBean.setTotalForModule(resultBean.getTotalForModule()+1);		// total for module
						resultBean.getNamesForModule().add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						
						if (dbResult.getCompletion() == 1) {	// completed for module
							resultBean.setCompletedForModule(resultBean.getCompletedForModule()+1);
							resultBean.getNamesCompletedForModule().add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						}
						
						if (dbResult.getIwdTiming() != null && dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_SENT && dbResult.getShiftEntry() == 1){	//	sent to IWD
							resultBean.setReqSentForModule(resultBean.getReqSentForModule()+1);
							resultBean.getNamesReqSentForModule().add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						}
						
						if (dbResult.getIwdTiming() != null && dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_PENDING && dbResult.getShiftEntry() == 1){	// scheduled, waiting to be sent to IWD
							resultBean.setSchedForModule(resultBean.getSchedForModule()+1);
							resultBean.getNamesSchedForModule().add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						}

						// not scheduled and available (on shift)
						if (dbResult.getCompletion() == 0 && (dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_CANCELED || dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_NONE)
								&& dbResult.getShiftEntry() == 1 && now.before(ShiftEndCalc)){
							resultBean.setNotSchedForModule(resultBean.getNotSchedForModule()+1);
							resultBean.getNamesNotSchedForModule().add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						}
					}
				}
				if ( ! found) {	// 1st time for combination of module_id + moked_id + inner_job_id
					PeleIWDBean resultBean = new PeleIWDBean();
					resultBean.setModuleId(dbResult.getModuleId());
					resultBean.setModuleTitle(dbResult.getModuleTitle());
					resultBean.setModuleOpenDateTime(dbResult.getModuleOpenDateTime());
					resultBean.setModuleCloseDateTime(dbResult.getModuleCloseDateTime());
					resultBean.setModuleTimeToComplete(dbResult.getModuleTimeToComplete());
					resultBean.setParentId(dbResult.getParentId());
					resultBean.setInnerJobId(dbResult.getInnerJobId());
					
					if (dbResult.getCompletion() == 1) {
						resultBean.setCompletedForModule(1);
						Vector<String> namesCompletedForModule = new Vector<String>();
						namesCompletedForModule.add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						resultBean.setNamesCompletedForModule(namesCompletedForModule);
					} else {
						resultBean.setCompletedForModule(0);
						resultBean.setNamesCompletedForModule(new Vector<String>());
					}
//					resultBean.setCompletedForModule(dbResult.getCompletion() == 1 ? 1 : 0);
					
					if (dbResult.getIwdTiming() != null && dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_SENT && dbResult.getShiftEntry() == 1) {
						resultBean.setReqSentForModule(1);
						Vector<String> namesReqSentForModule = new Vector<String>();
						namesReqSentForModule.add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						resultBean.setNamesReqSentForModule(namesReqSentForModule);
					} else {
						resultBean.setReqSentForModule(0);
						resultBean.setNamesReqSentForModule(new Vector<String>());
					}
//					resultBean.setReqSentForModule((dbResult.getIwdTiming() != null && dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_SENT && dbResult.getShiftEntry() == 1) ? 1 : 0 );

					if (dbResult.getIwdTiming() != null && dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_PENDING && dbResult.getShiftEntry() == 1) {
						resultBean.setSchedForModule(1);
						Vector<String> namesSchedForModule = new Vector<String>();
						namesSchedForModule.add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						resultBean.setNamesSchedForModule(namesSchedForModule);
					} else {
						resultBean.setSchedForModule(0);
						resultBean.setNamesSchedForModule(new Vector<String>());
					}
//					resultBean.setSchedForModule((dbResult.getIwdTiming() != null && dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_PENDING && dbResult.getShiftEntry() == 1) ? 1 : 0 );
					
					if (dbResult.getCompletion() == 0 && (dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_CANCELED || dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_NONE) 
							&& dbResult.getShiftEntry() == 1 && now.before(ShiftEndCalc)) {
						resultBean.setNotSchedForModule(1);
						Vector<String> namesNotSchedForModule = new Vector<String>();
						namesNotSchedForModule.add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
						resultBean.setNamesNotSchedForModule(namesNotSchedForModule);
					} else {
						resultBean.setNotSchedForModule(0);
						resultBean.setNamesNotSchedForModule(new Vector<String>());
					}
//					resultBean.setNotSchedForModule((dbResult.getCompletion() == 0 && (dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_CANCELED ||	dbResult.getIwdStatus() == SHFConstants.IWD_STATUS_NONE) 
//							&& dbResult.getShiftEntry() == 1 && now.before(ShiftEndCalc)) ? 1 : 0 );
					
					resultBean.setTotalForModule(1);
					Vector<String> namesTotalForModule = new Vector<String>();
					namesTotalForModule.add(dbResult.getFirstName() + " " + dbResult.getLastName() + " - " + dbResult.getEmpId());
					resultBean.setNamesForModule(namesTotalForModule);
					
					result.add(resultBean);
				}
			}
		}
		return result;
	}
	
	public Vector<PeleIWDBean> getEmpAndModulesSelect () throws ShfException {
		logger.debug("Starting getEmpAndModulesSelect()");
		
		Vector<PeleIWDBean> result = null;
		StringBuffer sql = new StringBuffer();
		
		sql.append("SELECT pele_emp.module_id,pele_emp.module_title,pele_emp.module_type,pele_emp.module_open_datetime,pele_emp.module_close_datetime,pele_emp.module_time_to_complete, ");
		sql.append("pele_emp.module_link,pele_emp.parent_unit parent_id,pele_emp.inner_job_id,pele_emp.emp_id,pele_emp.first_name,pele_emp.last_name,pele_emp.org_unit_id,emp_day.shf_employee_day_id, ");
		sql.append("emp_day.shift_start_time,emp_day.shift_end_time, nvl(emp_att.emp_arrived,0) shift_entry,pele_emp.completion,pele_emp.iwd_timing,pele_emp.iwd_status ");
		sql.append("FROM ( ");	
		sql.append("SELECT /*+ index (se EMPLOYEE_IDNUM_IND) index (pe SHF_PELEEMP_PK) index (u SOU_PK)  ordered  */ ");
		sql.append("pe.emp_id emp_id,se.first_name,se.last_name,u.parent_unit,u.org_unit_id,se.inner_job_id,pe.completion,pe.iwd_timing,pe.iwd_status,l.* ");
		sql.append("FROM shifter.shf_pele_lomdot l ");
		sql.append("INNER JOIN  shifter.shf_pele_employees pe ON pe.module_id = l.module_id ");
		sql.append("INNER JOIN shifter.shf_employees se ON se.emp_id_number = pe.emp_id ");
		sql.append("INNER JOIN shifter.shf_org_unit u ON u.org_unit_id = se.org_unit_id ");
		//sql.append("WHERE l.module_open_datetime <= trunc(?) AND l.module_close_datetime >= trunc(?) ");	// 1, 2
		sql.append("WHERE trunc(nvl(l.module_open_datetime,?) ) <= trunc(?) ");	// 1, 2
		sql.append("AND trunc(nvl(l.module_close_datetime ,?) )>= trunc(?) ");	// 3, 4

		sql.append("AND se.status_id = 3 ");
		sql.append("AND se.inner_job_id > 0 ) pele_emp ");
		sql.append("JOIN (SELECT /*+ index ( c SDC_SED_FK_I) */ ");
		sql.append("d.emp_id_number emp_id_number, ");
		sql.append("max(decode(trunc(nvl(c.new_shift_start, d.wm_date)),trunc(?),trunc(?),null)) shift_date, ");	// 5, 6
		sql.append("max(decode(nvl(trunc(c.new_shift_start), d.wm_date),trunc(?),d.shf_employee_day_id,null) ) shf_employee_day_id, ");		// 7
		sql.append("max(decode(trunc(nvl(c.new_shift_start, d.wm_date)),trunc(?),nvl(c.new_shift_start,d.wm_shift_start_datetime),null)) shift_start_time, ");		// 8
		sql.append("max(decode(trunc(nvl(c.new_shift_start, d.wm_date)),trunc(?),nvl(c.new_shift_end,d.wm_shift_end_datetime),null)) shift_end_time ");		// 9
		sql.append("FROM shifter.shf_employee_day d ");
		sql.append("LEFT JOIN shifter.shf_day_changes c ON c.shf_employee_day_id = d.shf_employee_day_id ");
		sql.append("WHERE 1=1 ");
		sql.append("AND NVL(c.new_day_type, d.wm_day_type) = 4 ");
		sql.append("GROUP BY d.emp_id_number ");
		sql.append(") emp_day ON emp_day.emp_id_number = substr(pele_emp.emp_id,1,8) ");
		sql.append("LEFT JOIN(SELECT a.shf_employee_day_id shf_employee_day_id,decode(a.stage_arrival_time,null,decode(a.station_arrival_time, null, 0, 1),1) emp_arrived ");
		sql.append("FROM shifter.shf_attendance a ");
		sql.append("WHERE (a.stage_arrival_time IS NOT NULL or a.station_arrival_time IS NOT NULL)) emp_att ON emp_att.shf_employee_day_id = emp_day.shf_employee_day_id ");
		sql.append("AND emp_day.shift_date = trunc(?) ");	// 10
		sql.append("WHERE 1=1 ");

		if ( IWDForm != null && IWDForm.getModule() != null && ! "00".equals(IWDForm.getModule()[0])) {
			sql.append("AND pele_emp.module_id IN ( ");
			for (int i = 0; i < IWDForm.getModule().length; i++) {
				sql.append("?");
				if (i < IWDForm.getModule().length-1) {
					sql.append(",");
				}
			}
			sql.append(") ");
		}
		if ( IWDForm != null && IWDForm.getMoked() != null && ! "00".equals(IWDForm.getMoked()[0])) {
			sql.append("AND pele_emp.parent_unit IN ( ");
			for (int i = 0; i < IWDForm.getMoked().length; i++) {
				sql.append("?");
				if (i < IWDForm.getMoked().length-1) {
					sql.append(",");
				}
			}
			sql.append(") ");
		}
		if ( IWDForm != null && IWDForm.getInnerJob() != null && ! "00".equals(IWDForm.getInnerJob()[0])) {
			sql.append("AND pele_emp.inner_job_id IN ( ");
			for (int i = 0; i < IWDForm.getInnerJob().length; i++) {
				sql.append("?");
				if (i < IWDForm.getInnerJob().length-1) {
					sql.append(",");
				}
			}
			sql.append(") ");
		}
		
		sql.append("ORDER BY pele_emp.module_id DESC, parent_id DESC, pele_emp.inner_job_id DESC ");
		
		DBAccess db = null;
		result = new Vector<PeleIWDBean>();
		int index = 1;
		Date now = new Date();
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(index++,now);	// 1
			db.setTimestamp(index++,now);	// 2
			db.setTimestamp(index++,now);	// 3
			db.setTimestamp(index++,now);	// 4
			db.setTimestamp(index++,now);	// 5
			db.setTimestamp(index++,now);	// 6
			db.setTimestamp(index++,now);	// 7
			db.setTimestamp(index++,now);	// 8
			db.setTimestamp(index++,now);	// 9
			db.setTimestamp(index++,now);	// 10
			if ( IWDForm != null && IWDForm.getModule() != null && ! "00".equals(IWDForm.getModule()[0])) {
				for (int i = 0; i < IWDForm.getModule().length; i++) {
					db.setInt(index++,Integer.valueOf(IWDForm.getModule()[i]));
				}
			}
			if ( IWDForm != null && IWDForm.getMoked() != null && ! "00".equals(IWDForm.getMoked()[0])) {
				for (int i = 0; i < IWDForm.getMoked().length; i++) {
					db.setString(index++,IWDForm.getMoked()[i]);
				}
			}
			if ( IWDForm != null && IWDForm.getInnerJob() != null && ! "00".equals(IWDForm.getInnerJob()[0])) {
				for (int i = 0; i < IWDForm.getInnerJob().length; i++) {
					db.setInt(index++,Integer.valueOf(IWDForm.getInnerJob()[i]));
				}
			}
			
			db.executeQuery();
			db.populate("bzq.shf.bean.PeleIWDBean", result);
			
		} catch(DBQueryNoRowsException e) {
					
			return result;
			
		} catch (DBException e) {
			logger.error("DB Error : "+e.getMessage(), e);
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing DB connection : "+e.getMessage(), e);
				throw new ShfException("Error while closing DB connection", e);
			}
		}
		return result;
	}
	
	public Vector<PeleIWDBean> getAllModules () throws ShfException {
		
		Vector<PeleIWDBean> result = null;
	
		StringBuffer sql = new StringBuffer();

		sql.append("SELECT * FROM shifter.shf_pele_lomdot l ORDER BY l.module_id DESC");
		
		DBAccess db = null;
		result = new Vector<PeleIWDBean>();
		
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			db.populate("bzq.shf.bean.PeleIWDBean", result);
		} catch(DBQueryNoRowsException e) {
					
			return result;
			
		} catch (DBException e) {
			logger.error("DB Error : "+e.getMessage(), e);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing DB connection : "+e.getMessage(), e);
			}
		}
		return result;
	}
	
	public void doSchedule() throws ShfException {
		logger.debug("Starting doSchedule()");
		logger.info("Starting doSchedule() by user : "+IWDForm.getUserId()+", module id : "+ IWDForm.getModuleId() + ", moked id : " + IWDForm.getMokedId() + ", inner job id : " + IWDForm.getInnerJobId());
		
		int minsAfterShiftStart = Integer.parseInt(SHFParameters.getIwdMinAfterShiftStart(SHFTableUtils.getAgafCodeOf(IWDForm.getMokedId())).getValue());	// minutes
		int minsBeforeShiftEnd = Integer.parseInt(SHFParameters.getIwdMinBeforeShiftEnd(SHFTableUtils.getAgafCodeOf(IWDForm.getMokedId())).getValue());;	// minutes
		int defaultTimeToComplete = Integer.parseInt(SHFParameters.getIwdDefaultTimeToComplete(SHFTableUtils.getAgafCodeOf(IWDForm.getMokedId())).getValue());	// minutes
		Calendar now = Calendar.getInstance();
		
		Vector<PeleIWDBean> empForSchedRaw = getEmpAndModulesSelect();
		Vector<PeleIWDBean> empForSched = new Vector<PeleIWDBean>();
		
		System.out.println("doSchedule() filter report");
		for (PeleIWDBean peleIWDBean : empForSchedRaw) {

			// remove agents w/o shift entry, already completed or scheduled (scheduled BUT NOT canceled, because canceled can be rescheduled)
			if (peleIWDBean.getShiftEntry() == 0 || peleIWDBean.getCompletion() == 1 || (peleIWDBean.getIwdStatus() != SHFConstants.IWD_STATUS_NONE && peleIWDBean.getIwdStatus() != SHFConstants.IWD_STATUS_CANCELED)) {
				System.out.println("removing emp_id :"+peleIWDBean.getEmpId()+" "+peleIWDBean.getFirstName()+" "+peleIWDBean.getLastName()+" FOR getShiftEntry() == 0 OR getCompletion() == 1 OR (getIwdStatus() != TIMIG_STATUS_NONE && getIwdStatus() != TIMIG_STATUS_CANCELED)");
				continue;
			}
			
			// remove by module id + moked id + inner job id from user
			if( ! peleIWDBean.getParentId().equals(IWDForm.getMokedId()) || peleIWDBean.getModuleId() != IWDForm.getModuleId() || peleIWDBean.getInnerJobId() != IWDForm.getInnerJobId()) {
				System.out.println("removing emp_id :"+peleIWDBean.getEmpId()+" "+peleIWDBean.getFirstName()+" "+peleIWDBean.getLastName()+" FOR parentUnit not equal IWDForm.getMokedId() OR getModuleId() != IWDForm.getModuleId() OR getInnerJobId() != IWDForm.getInnerJobId()");
				continue;
			}
			
			// remove agents that already ended shift or not enough time to complete before shift ends
			Calendar shiftEndCalc = Calendar.getInstance();
			shiftEndCalc.setTime(peleIWDBean.getShiftEnd());
			int timeToComplete = peleIWDBean.getModuleTimeToComplete() > 0 ? peleIWDBean.getModuleTimeToComplete() : defaultTimeToComplete;
			shiftEndCalc.add(Calendar.MINUTE, -(minsBeforeShiftEnd + timeToComplete));
			if (shiftEndCalc.before(now) ) {
				System.out.println("removing emp_id :"+peleIWDBean.getEmpId()+" "+peleIWDBean.getFirstName()+" "+peleIWDBean.getLastName()+" FOR shiftEndCalc.before(now)");
				continue;	
			}
			empForSched.add(peleIWDBean);
		}
		System.out.println("doSchedule() filter report END");
		
		if (empForSched.size() > 0) {
			int actualAmountPerTiming = IWDForm.getAmountPerTiming() > empForSched.size() ? empForSched.size() : IWDForm.getAmountPerTiming();
			int intervalSize = IWDForm.getIntervalSize();
			int actualTotalForTiming = IWDForm.getTotalForTiming() > empForSched.size() ? empForSched.size() : IWDForm.getTotalForTiming();
			int numOfRounds = actualTotalForTiming / actualAmountPerTiming + (actualTotalForTiming % actualAmountPerTiming == 0 ? 0 : 1);
			
			if (actualAmountPerTiming == 0 || intervalSize == 0) {
				logger.error("Error in doSchedule() : parameter amountPerTiming is greater then total not scheduled for module OR amountPerTiming = 0 OR intervalSize = 0");
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
			
			// sort by shift end, closest to now
			final Date nowDate = now.getTime();
			Collections.sort(empForSched, new Comparator<PeleIWDBean>() {
				public int compare(PeleIWDBean o1, PeleIWDBean o2) {
						long diff1 = Math.abs(o1.getShiftEnd().getTime() - nowDate.getTime());
						long diff2 = Math.abs(o2.getShiftEnd().getTime() - nowDate.getTime());
						return Long.valueOf(diff1).compareTo(Long.valueOf(diff2));
					}
			});
			
			Vector<PeleIWDBean> empForUpdate = new Vector<PeleIWDBean>();	// final vector for DB update
			Vector<Date> scheduledTimes = new Vector<Date>();	// final vector for DB update
			Calendar schedTime = Calendar.getInstance();
			schedTime.setTime(now.getTime());
			Vector <PeleIWDBean> empForUpdateTmp = new Vector<PeleIWDBean>();	// for shift that didn't start yet or didn't pass X time from shift start for schedule
			int totalForTiming = IWDForm.getTotalForTiming();
			int currAgentInd = 0;
			
			System.out.println("Starting scheduling ... ");
			System.out.println("amountPerTiming :" + actualAmountPerTiming);
			System.out.println("intervalSize :" + intervalSize);
			System.out.println("totalForTiming :" + totalForTiming);
			System.out.println("numOfRounds :" + numOfRounds);
			System.out.println("minsAfterShiftStart :" + minsAfterShiftStart);
			System.out.println("minsBeforeShiftEnd :" + minsBeforeShiftEnd);
			System.out.println("defaultTimeToComplete :" + defaultTimeToComplete);
			
			for (int i = 0; i <= numOfRounds-1; i++) {	// main loop, to cover all agents for timing
				System.out.println("Round #" + (i+1));
				schedTime.add(Calendar.MINUTE, intervalSize);
				System.out.println("Next schedTime :" + BaseConvert.dateToString(schedTime.getTime(),"dd/MM/yyyy HH:mm:ss"));
				
				boolean scheduledTimesAdded = false;
				
				// 1st check previously not scheduled (because of shift start time), and check if can reschedule
				if (empForUpdateTmp.size() > 0) {
					System.out.println("Checking for TMP emp's for reschedule ...");
					Vector<Integer> remove = new Vector<Integer>();
					
					for (int j = 0; j <= empForUpdateTmp.size()-1; j++) {
//						if (empForUpdateTmp.get(j) == null)
//							continue;
						
						PeleIWDBean empBeanTmp = empForUpdateTmp. get(j);
						Calendar shiftStartCalc = Calendar.getInstance();
						shiftStartCalc.setTime(empBeanTmp.getShiftStart());
						shiftStartCalc.add(Calendar.MINUTE, minsAfterShiftStart);
						
						Calendar shiftEndCalc = Calendar.getInstance();
						shiftEndCalc.setTime(empBeanTmp.getShiftEnd());
						int timeToComplete = empBeanTmp.getModuleTimeToComplete() > 0 ? empBeanTmp.getModuleTimeToComplete() : defaultTimeToComplete;
						shiftEndCalc.add(Calendar.MINUTE, -(minsBeforeShiftEnd + timeToComplete));
						
						if (shiftStartCalc.before(schedTime) && schedTime.before(shiftEndCalc)) {	// check if on this iteration of numOfRounds, shift start if before scheduled timing
							empBeanTmp.setIwdTiming(schedTime.getTime());
							empBeanTmp.setIwdStatus(SHFConstants.IWD_STATUS_PENDING);
							empForUpdate.add(empBeanTmp);
							scheduledTimesAdded = true;	// must come after empForUpdate.add()
							remove.add(j);
							System.out.println("Rescheduling from TMP, emp_id : " + empBeanTmp.getEmpId()+", schedTime : " + BaseConvert.dateToString(schedTime.getTime(),"dd/MM/yyyy HH:mm:ss") +", shift start : " + BaseConvert.dateToString(empBeanTmp.getShiftStart(),"dd/MM/yyyy HH:mm:ss") + ", shift end : " + BaseConvert.dateToString(empBeanTmp.getShiftEnd(),"dd/MM/yyyy HH:mm:ss"));
						}
					}
					if (remove.size() > 0) {	// remove scheduled from empForUpdateTmp in order not to reschedule them on next iteration of numOfRounds.
						for (Integer indRemove : remove) {
							empForUpdateTmp.remove(indRemove);
						}
					}
				}
				
				int amountPerRound = totalForTiming - actualAmountPerTiming >= 0 ? actualAmountPerTiming : totalForTiming;
				
				for (int k = 0; k <= amountPerRound-1; k++) {
	
					// 2nd check next emp's shift start and if ok then schedule.
					PeleIWDBean empBean = empForSched.get(currAgentInd);
					currAgentInd++;
					
					Calendar shiftStartCalc = Calendar.getInstance();
					shiftStartCalc.setTime(empBean.getShiftStart());
					shiftStartCalc.add(Calendar.MINUTE, minsAfterShiftStart);
					
					if (shiftStartCalc.after(schedTime)) {	// schedTime is before shift starts, can't schedule, save for later interval
						empForUpdateTmp.add(empBean);
						continue;
					}
					
					// all ok, set time for schedule and add to final array
					empBean.setIwdTiming(schedTime.getTime());
					empBean.setIwdStatus(SHFConstants.IWD_STATUS_PENDING);
					empForUpdate.add(empBean);
					scheduledTimesAdded = true;	// must come after empForUpdate.add()
				}
				totalForTiming -= actualAmountPerTiming;
				if (scheduledTimesAdded == true) {
					scheduledTimes.add(schedTime.getTime());
				}
				
			}	// main loop END
			
			if (empForUpdateTmp.size() > 0) {
				
				System.out.println("Following agents were not scheduled because shift has not started yet :");
				for (PeleIWDBean empBeanTmp : empForUpdateTmp) {
					System.out.println("emp id : " + empBeanTmp.getEmpId() + ", last schedTime : " + BaseConvert.dateToString(schedTime.getTime(),"dd/MM/yyyy HH:mm:ss") + ", shift start : " + empBeanTmp.getShiftStart() + " + "+minsAfterShiftStart+" after shift start");
				}
			} else {
				System.out.println("TMP is emtpy !! (TMP = reschedule due to shift start)");
			}
			System.out.println("END OF SCHEDULING !!");
			
			// next update DB
			if (empForUpdate.size() > 0) {
				StringBuffer sql = new StringBuffer();
				
				for (Date scheduledTime : scheduledTimes) {
					boolean found = false;
					for (int i = 0; i <= empForUpdate.size()-1; i++) {
						if (empForUpdate.get(i).getIwdTiming().equals(scheduledTime)) {
							found = true;
							break;
						}
					}
					if (found) {
						sql.append("UPDATE shifter.shf_pele_employees e SET ");
						sql.append("e.iwd_timing = ?, ");	// 1
						sql.append("e.iwd_status = ? ");	// 2
						sql.append("WHERE e.emp_id IN ( ");
						for (int i = 0; i <= empForUpdate.size()-1; i++) {
							if (empForUpdate.get(i).getIwdTiming().equals(scheduledTime)) {
								sql.append("?");	// 3
								if (i < empForUpdate.size()-1) {
									if (empForUpdate.get(i+1).getIwdTiming().equals(scheduledTime)) {
										sql.append(",");
									}
								}
							}
						}
						sql.append(") ");
						sql.append("AND e.module_id = ? ");	// 4
						sql.append(";");
					}
				}
				
				String[] splitSql = sql.toString().split(";");
				if (splitSql.length > 0) {
					DBAccess db = null;
					
					try{
						db = new DBAccess(false);
						
						for (int k = 0; k <= splitSql.length-1; k++) {
							int index = 1;
							db.prepareStatement(splitSql[k]);
							
							db.setTimestamp(index++, scheduledTimes.get(k));	// 1
							db.setInt(index++, SHFConstants.IWD_STATUS_PENDING);	// 2
							for (int i = 0; i <= empForUpdate.size()-1; i++) {
								if (empForUpdate.get(i).getIwdTiming().equals(scheduledTimes.get(k))) {
									db.setString(index++, empForUpdate.get(i).getEmpId());	// 3
								}
							}
							db.setInt(index++, IWDForm.getModuleId());	// 4
							
							db.executeUpdate();
						}
						
						db.commit();
					} catch(DBUpdateNoRowsException e) {
						
					} catch (DBException e) {
						logger.error("DB error at doSchedule() while updating : "+e.getMessage());
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
						throw new ShfException(actionErrors);
					} finally {
						try {
							db.close();
						} catch (DBException e) {
							logger.error("DB error at doSchedule() while closing connection : "+e.getMessage(),e);
						}
					}
					
					insertToPeleEmpHistory(empForUpdate);	// update history table
				}
			}
		} else {
			logger.info("empForUpdate size is 0");
		}
	}	//  Function END
	
	public void doScheduleCancel() throws ShfException {
		logger.debug("Starting doScheduleCancel()");
		if(IWDForm == null || IWDForm.getModuleId() == 0 || IWDForm.getMokedId() == null || IWDForm.getInnerJobId() == 0)
			throw new ShfException("Invalid parameters");
		
		StringBuffer sqlSelect = new StringBuffer();
		sqlSelect.append("SELECT pe.* ");
		sqlSelect.append("FROM shifter.shf_pele_employees pe ");
		sqlSelect.append("INNER JOIN shifter.shf_employees se ON se.emp_id_number = pe.emp_id ");
		sqlSelect.append("INNER JOIN shifter.shf_org_unit u ON u.org_unit_id = se.org_unit_id ");
		sqlSelect.append("WHERE se.inner_job_id = ? ");		// 1
		sqlSelect.append("AND u.parent_unit = ? ");			// 2
		sqlSelect.append("AND pe.module_id = ? ");			// 3
		sqlSelect.append("AND pe.iwd_timing IS NOT NULL ");
		sqlSelect.append("AND pe.iwd_status = ? ");			// 4

		DBAccess db = null;
		int index = 1;
		Vector<PeleIWDBean> toCancelVec = null;
		
		try {
			db = new DBAccess();
			db.prepareStatement(sqlSelect.toString());
			
			db.setInt(index++, IWDForm.getInnerJobId());			// 1
			db.setString(index++, IWDForm.getMokedId());			// 2
			db.setInt(index++, IWDForm.getModuleId());				// 3
			db.setInt(index++, SHFConstants.IWD_STATUS_PENDING);	// 4
			
			db.executeQuery();
			toCancelVec = new Vector<PeleIWDBean>();
			db.populate("bzq.shf.bean.PeleIWDBean", toCancelVec);
			
		} catch(DBQueryNoRowsException e) {
			
			
		} catch (DBException e) {
			logger.error("DB Error : "+e.getMessage(), e);
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing DB connection : "+e.getMessage(), e);
				throw new ShfException("Error while closing DB connection", e);
			}
		}
		
		if (toCancelVec.size() > 0) {
			StringBuffer sql = new StringBuffer();
			
			sql.append("UPDATE shifter.shf_pele_employees e SET ");
			sql.append("e.iwd_status = ? ");		// 1
			sql.append("WHERE e.module_id = ? ");	// 2
			sql.append("AND e.emp_id = ? ");		// 3

			try {
				db = new DBAccess(false);
				
				for (PeleIWDBean cancelBean : toCancelVec) {
					index = 1;
					db.prepareStatement(sql.toString());
					
					db.setInt(index++, SHFConstants.IWD_STATUS_CANCELED);	// 1
					db.setInt(index++, cancelBean.getModuleId());			// 2
					db.setString(index++, cancelBean.getEmpId());			// 3
					
					try {
						db.executeUpdate();
						cancelBean.setIwdStatus(SHFConstants.IWD_STATUS_CANCELED);
					} catch(DBUpdateNoRowsException e) {
						logger.error("Unecpexted DBUpdateNoRowsException while canceling schedule for for emp_id : " + cancelBean.getEmpId());
					}
				}
				db.commit();
				insertToPeleEmpHistory(toCancelVec);
			} catch (DBException e) {
				logger.error("DB error while updating : "+e.getMessage(), e);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				throw new ShfException(actionErrors);
			} finally {
				try {
					db.close();
				} catch (DBException e) {
					logger.error("DB error while closing connection : "+e.getMessage(),e);
				}
			}
		}
	}//  Function END
	
	public void insertToPeleEmpHistory (Vector<PeleIWDBean> emps) throws ShfException {
		logger.debug("Starting insertToPeleEmpHistory()");
		
		if(emps == null || emps.size() == 0) {
			throw new ShfException("Invalid argument passed to insertToPeleEmpHistory(), NULL or EMPTY");
		}
		Date now = new Date();
		StringBuffer sql = new StringBuffer();
		
		sql.append("INSERT INTO shifter.shf_pele_employees_history VALUES (?,?,?,?,?)");
		DBAccess db = null;
		
		try{
			db = new DBAccess(false);
			db.prepareStatement(sql.toString());
			
			for (PeleIWDBean peleIWDBean : emps) {
				int index = 1;
				db.setInt(index++, peleIWDBean.getModuleId());
				db.setString(index++, peleIWDBean.getEmpId());
				db.setTimestamp(index++, peleIWDBean.getIwdTiming());
				db.setInt(index++, peleIWDBean.getIwdStatus());
				db.setTimestamp(index++, now);
				
				db.executeUpdate();
			}
			db.commit();
		} catch (DBException e) {
			logger.error("DB error while insert : " + e.getMessage(), e);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection : " + e.getMessage(), e);
			}
		} 
	}
	
	public void setFormDefaults() throws ShfException {
		
		if (IWDForm == null) {
			throw new ShfException("Form is NULL, unable set defaults");
		}
		
		String[] arr={"00"};
		
		IWDForm.setModule(arr);
		IWDForm.setMoked(arr);
		IWDForm.setInnerJob(arr);
		
		if (IWDForm.getUserAgaf() == null) {
			String userAgaf = "00101252";
			IWDForm.setUserAgaf(userAgaf);
			IWDForm.setAgaf(userAgaf);
		}
		
	} // END Method setFormDefaults()
	
}	// END Class

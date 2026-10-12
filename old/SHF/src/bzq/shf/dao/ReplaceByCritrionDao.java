/*
 * Created on 26/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.sql.Timestamp;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.TreeSet;
import java.util.Vector;

import javax.jms.JMSException;
import javax.naming.NamingException;
import javax.servlet.ServletContext;
import javax.xml.bind.JAXBException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;

import bzq.forms.BaseForm;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.forms.BuildingForm;
import bzq.shf.model.BreakDataModel;
import bzq.shf.model.BuildingModel;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.transfer.OfferReplaceByCritrion;
import bzq.shf.transfer.ReplaceByCritrion;
import bzq.shf.transfer.ReplaceCandidates;
import bzq.shf.transfer.ReplaceShift;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shfsp.request.SHFSPBreaks;
import bzq.shfsp.request.SHFSPBreaks.BreakInfo;
import bzq.utils.BaseConvert;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceByCritrionDao extends SimpleFactoryDao {
	private Logger logger = Logger.getLogger(EventReasonDao.class);
	
	public Vector selectMyWeekShifts(BaseForm bf) throws ShfException	{
//		SimpleDateFormat ft = new SimpleDateFormat ("HH:mm:ss:SS");
//		System.out.println("selectMyWeekShifts() time : "+ft.format(new Date()));
		logger.debug("ReplaceByCritrionDao: beginning of selectMyWeekShifts.");
		Vector shifts = null;
		ReplaceByCritrion replaceByCritrion=null;
		
		StringBuffer sql=new StringBuffer();
		sql.append("select t.shf_employee_day_id,nvl(d.new_shift_start,t.wm_shift_start_datetime) as starttime,nvl(d.new_shift_end,t.wm_shift_end_datetime) as endtime, ");
		sql.append("nvl(d.new_activity,t.wm_sch_activity_id_data) as activity,nvl(d.new_employee_id,t.emp_id_number) as emp_id_number,e.first_name||' '||e.last_name as fullname  ");
		sql.append("from SHIFTER.shf_employee_day t ");
		sql.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on nvl(d.new_employee_id,t.emp_id_number)=substr(e.emp_id_number,1,8) ");
		sql.append("where nvl(d.new_day_type,t.wm_day_type)=? ");//-- type of working day (constant)
		//sql.append("and nvl(d.new_site_id,t.wm_site_id)=? ");// --site of moked (page -site)
		sql.append("and nvl(d.new_shift_start,t.wm_shift_start_datetime) between trunc(?+1,'IW')-2 and trunc(?+1,'IW')+7 ");//  -- shifts replaced in the same week -critrion 1 (page -starttime)
		sql.append("and nvl(d.new_employee_id,t.emp_id_number)=? ");// -- we want other personal shifts (session)
		sql.append("and nvl(d.new_shift_start-sysdate,t.wm_shift_start_datetime-sysdate)>=? ");// --time before shift begin when we can search replaces -critrion 5 (page -starttime)
		//sql.append("and e.replace_allowed=? ");// -- only employees that allow to replace
		DBAccess dBAccess=null;
		int param=1;
		try {
			dBAccess=new DBAccess();
			replaceByCritrion = (ReplaceByCritrion)bf;
			String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(replaceByCritrion.getAllowedAgaf()).getValue();
			double minHoursBeforeSwitchNum = (SHFUtils.parseLong(minHoursBeforeSwitch,DEFUALT_TIME_BEFORE_SHIFT_BEGIN)/TIME_BEFORE_SHIFT_BEGIN);			
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(param++,WORK_DAY);
			//dBAccess.setInt(param++,Integer.parseInt(replaceByCritrion.getSite()));
			dBAccess.setDate(param++,replaceByCritrion.getStartTime());
			dBAccess.setDate(param++,replaceByCritrion.getStartTime());
			dBAccess.setString(param++,replaceByCritrion.getEmployeePersonalId());
			dBAccess.setDouble(param++,minHoursBeforeSwitchNum);
			//dBAccess.setString(param++,SHIFT_ALLOWED);						
			dBAccess.executeQuery();
			shifts=new Vector();
			ReplaceByCritrion replaceByCritrionShifts=null;
			while(dBAccess.next()){
				replaceByCritrionShifts=new ReplaceByCritrion();												
				dBAccess.populate(replaceByCritrionShifts);
				if (replaceByCritrionShifts.getShiftId().equals(replaceByCritrion.getShiftId())) continue;
				shifts.add(replaceByCritrionShifts);
			}
	
	
	
		} catch(DBQueryNoRowsException e){
			logger.debug("no shifts for the user " + e.getMessage());
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao selectMyWeekShifts " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao selectMyWeekShifts", e);
		} finally{
			try {
				dBAccess.close();				
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	return shifts;
	}
	public Vector selectShiftsInReplaceRepository(String userId, String allowMoked, String allowedAgaf) throws ShfException	{
		logger.debug("ReplaceByCritrionDao: beginning of selectShiftsInReplaceRepository.");
		Vector shifts = null;
		OfferReplaceByCritrion offerReplaceByCritrion = null;	
		boolean isSuperUser =  (userId==null);
		int param=1;
		
		StringBuffer sql=new StringBuffer();		
		sql.append("select t.shf_employee_day_id,c1.status,c1.offer,nvl(d.new_site_id,t.wm_site_id) as site,");
		sql.append("nvl(d.new_shift_start,t.wm_shift_start_datetime) as starttime,nvl(d.new_shift_end,t.wm_shift_end_datetime) as endtime,");
		sql.append("nvl(d.new_activity,t.wm_sch_activity_id_data) as activity,nvl(d.new_employee_id,t.emp_id_number) as EMP_ID_NUMBER,");
		sql.append("e1.employee_id,e1.ORG_UNIT_ID,e1.first_name||' '||e1.last_name as fullname,e1.inner_job_id,e1.manager_id,");
		sql.append("nvl(d2.new_shift_start , t2.wm_shift_start_datetime) as offerstarttime, ");
		sql.append("nvl(d2.new_shift_end,t2.wm_shift_end_datetime) as offerendtime,e2.employee_id as offeremployeeid,");
		sql.append("e2.emp_id_number as offeremployeeidnum, e2.first_name||' '||e2.last_name as offerfullname,e2.manager_id as offermanagerid, e2.org_unit_id as offerorgunitid, c1.note  ");
		
		sql.append("FROM SHIFTER.shf_replace_candidates c1 ");
		sql.append("left join SHIFTER.shf_employee_day t on t.shf_employee_day_id=c1.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e1 on nvl(d.new_employee_id,t.emp_id_number)=substr(e1.emp_id_number,1,8) ");
		sql.append("left join SHIFTER.shf_employee_day t2 on c1.offer=t2.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_day_changes d2 on c1.offer=d2.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e2 on nvl(d2.new_employee_id,t2.emp_id_number)=substr(e2.emp_id_number,1,8) ");
		sql.append("where c1.status is not null and t.shf_employee_day_id is not null ");
		if (!isSuperUser)
			sql.append("and e1.emp_id_number =? ");
		sql.append("and nvl(d.new_shift_start,t.wm_shift_start_datetime)-sysdate>=? ");	
		
		sql.append("order by starttime,fullname ");
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(allowedAgaf).getValue();
			double minHoursBeforeSwitchNum = SHFUtils.parseLong(minHoursBeforeSwitch,DEFUALT_TIME_BEFORE_SHIFT_BEGIN)/TIME_BEFORE_SHIFT_BEGIN;

						
			dBAccess.prepareStatement(sql.toString());
			if (!isSuperUser)	
				dBAccess.setString(param++,userId);							
			dBAccess.setDouble(param++,minHoursBeforeSwitchNum);
			
			dBAccess.executeQuery();
			shifts=new Vector();
			
			while(dBAccess.next()){
				offerReplaceByCritrion =new OfferReplaceByCritrion();																
				dBAccess.populate(offerReplaceByCritrion);
				
				if(allowedAgaf!=null){
					try{
						
						String site=offerReplaceByCritrion.getSite();
//						System.out.println("site: "+site);
						
						String moked=SHFTableUtils.getUnitCodeOfSite(site);
//						System.out.println("moked: "+moked);
						
						String agaf=SHFTableUtils.getAgafCodeOf(moked);
//						System.out.println("agaf: "+agaf);
						
						if(agaf.equals(allowedAgaf)){
							shifts.add(offerReplaceByCritrion);
						}
					}catch (NullPointerException e) {
						logger.error("error while checking if agaf=allowed agaf "+e);
					}
				}else{
					shifts.add(offerReplaceByCritrion);
				}
				
			}
		} catch(DBQueryNoRowsException e){
			logger.debug("no shifts for the user " + e.getMessage());
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao selectShiftsInReplaceRepository " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao selectShiftsInReplaceRepository", e);
		} finally{
			try {
				dBAccess.close();				
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}	
		return shifts;
	}
	
	public Vector<OfferReplaceByCritrion> populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId( Vector<String> shiftsId ) throws ShfException	{
		logger.debug("ReplaceByCritrionDao: beginning of populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId().");
		if (shiftsId == null || shiftsId.size() < 1) {
			logger.error("error in populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId(), variable 'shiftsId' not valid ");
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}
		Vector<OfferReplaceByCritrion> result = null;
		
		StringBuffer sql=new StringBuffer();		
		sql.append("select t.shf_employee_day_id,c1.status,c1.offer,nvl(d.new_site_id,t.wm_site_id) as site,");
		sql.append("nvl(d.new_shift_start,t.wm_shift_start_datetime) as starttime,nvl(d.new_shift_end,t.wm_shift_end_datetime) as endtime,");
		sql.append("nvl(d.new_activity,t.wm_sch_activity_id_data) as activity,nvl(d.new_employee_id,t.emp_id_number) as EMP_ID_NUMBER,");
		sql.append("e1.employee_id,e1.ORG_UNIT_ID,e1.first_name||' '||e1.last_name as fullname,e1.inner_job_id,e1.manager_id,");
		sql.append("nvl(d2.new_shift_start , t2.wm_shift_start_datetime) as offerstarttime, ");
		sql.append("nvl(d2.new_shift_end,t2.wm_shift_end_datetime) as offerendtime,e2.employee_id as offeremployeeid,");
		sql.append("e2.emp_id_number as offeremployeeidnum, e2.first_name||' '||e2.last_name as offerfullname,e2.manager_id as offermanagerid, e2.org_unit_id as offerorgunitid  ");
		
		sql.append("FROM SHIFTER.shf_replace_candidates c1 ");
		sql.append("left join SHIFTER.shf_employee_day t on t.shf_employee_day_id=c1.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e1 on nvl(d.new_employee_id,t.emp_id_number)=substr(e1.emp_id_number,1,8) ");
		sql.append("left join SHIFTER.shf_employee_day t2 on c1.offer=t2.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_day_changes d2 on c1.offer=d2.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e2 on nvl(d2.new_employee_id,t2.emp_id_number)=substr(e2.emp_id_number,1,8) ");
		sql.append("where c1.status is not null and t.shf_employee_day_id is not null ");
		sql.append("and  t.shf_employee_day_id in ( ");
			Iterator<String> iter = shiftsId.iterator();
			while(iter.hasNext()) {
				iter.next();
				sql.append("?");
				if (iter.hasNext()) {
					sql.append(",");
				}
			}
		sql.append(")");
		
		int param = 1;
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			
			for (String shiftId : shiftsId) {
				dBAccess.setString(param++, shiftId);
			}
			
			dBAccess.executeQuery();
			result = new Vector<OfferReplaceByCritrion>();
			dBAccess.populate("bzq.shf.transfer.OfferReplaceByCritrion",result);
			
		} catch(DBQueryNoRowsException e){
			logger.debug("no shifts for the user " + e.getMessage());
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId() " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId()", e);
		} finally{
			try {
				dBAccess.close();				
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}	
		
		return result;
	}
	public Vector selectAppropriateReplaceCandidate(BaseForm bf) throws ShfException	{
//		SimpleDateFormat ft = new SimpleDateFormat ("HH:mm:ss:SS");
//		System.out.println("selectAppropriateReplaceCandidate() time : "+ft.format(new Date()));
		ReplaceByCritrion mycand = (ReplaceByCritrion)bf;
		AgentDayBean myday = ShiftDataModel.populateShift(Long.parseLong(mycand.getShiftId()));
		Vector vec = selectFirstCheckCandidates(bf,myday);
		Vector newSuitable = checkShiftsInRange( vec, myday );		// Igal 12.2014
//		Vector suitable = new Vector();			// -- START -- old code to check shifts in range of parameter between shifts
//		ReplaceByCritrion rep = null;
//		if(vec != null && vec.size()>0){
//			for(int i=0;i<vec.size();i++){
//				rep=(ReplaceByCritrion)vec.get(i);
//				AgentDayBean otherDay=ShiftDataModel.populateShift(Long.parseLong(rep.getShiftId()));
//				try{
//					CheckValidDate.checkSwitch(myday,otherDay);
//					CheckValidDate.checkSwitch(otherDay,myday);
//					suitable.add(rep);
//				}catch(ShfException e){
//					e.printStackTrace();
//					logger.error(e);
//				}
//			}
//		}										
//		return suitable;	// -- END -- old code to check shifts in range of parameter between shifts
		return newSuitable;
	}
	
	public Vector selectFirstCheckCandidates(BaseForm bf,AgentDayBean myday) throws ShfException	{
		ReplaceByCritrion mycand=(ReplaceByCritrion)bf;
		logger.debug("ReplaceByCritrionDao: beginning of selectFirstCheckCandidates().");

		Vector vec = null;
		int param=1;
		StringBuffer sql=new StringBuffer();
		sql.append("select d.shf_employee_day_id, ");
		sql.append("nvl(c.new_shift_start, ");
		sql.append("d.wm_shift_start_datetime) as starttime, ");
		sql.append("nvl(c.new_shift_end,d.wm_shift_end_datetime) as endtime, ");
		sql.append("nvl(c.new_site_id,d.wm_site_id) as site ,");
		sql.append("nvl(c.new_activity,d.wm_sch_activity_id_data) as activity, ");
		sql.append("nvl(c.new_employee_id,d.emp_id_number) as emp_id_number, ");
		sql.append("e.employee_id,e.first_name||' '||e.last_name as fullname,e.inner_job_id,e.ORG_UNIT_ID  ");
		sql.append("from shifter.shf_replace_candidates n ");
		sql.append("left join shifter.shf_employee_day d on d.shf_employee_day_id=n.shf_employee_day_id ");
		sql.append("left join shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("where e.employee_id>0 ");
		sql.append("and nvl(c.new_day_type,d.wm_day_type)=? ");	//	1
		sql.append("and n.status=? ");	// 2
		if(myday.isNeightShift()){ 
			sql.append("and d.wm_site_id=? ");	//	3
		}
		sql.append("and nvl(c.new_shift_start,d.wm_shift_start_datetime) between trunc(?+1,'IW')-1 and trunc(?+1,'IW')+6 ");	//	4 , 5
		sql.append("and e.employee_id <> ? ");	//	6
		sql.append("and nvl(c.new_shift_start-sysdate,d.wm_shift_start_datetime-sysdate)>=? ");	//	7, added by Igal - remove past shifts suggested for switch bug	
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			ReplaceByCritrion replaceByCritrion = (ReplaceByCritrion)bf;
			String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(replaceByCritrion.getAllowedAgaf()).getValue();
			double minHoursBeforeSwitchNum = (SHFUtils.parseLong(minHoursBeforeSwitch,DEFUALT_TIME_BEFORE_SHIFT_BEGIN)/TIME_BEFORE_SHIFT_BEGIN);
			
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);	//	1
			db.setString(param++,SHFConstants.STATUS_OPEN);	//	2
			if(myday.isNeightShift()){
				db.setString(param++,myday.getSiteId());	//	3
			}
			db.setDate(param++,myday.getShiftStart());	//	4
			db.setDate(param++,myday.getShiftStart());	//	5
			db.setInt(param++,myday.getEmployeeId());	//	6
			db.setDouble(param++,minHoursBeforeSwitchNum);	//	7
			
			db.executeQuery();
			
			ReplaceByCritrion rep=null;
			int mylen=SHFUtils.getMinutesBetween(myday.getShiftStart(),myday.getShiftEnd());
			vec=new Vector();
			int diff_param=0;
			String str_diff_param=SHFParameters.getMaxDifferenceForSwitch( SHFTableUtils.getAgafCodeOf(SHFTableUtils.getUnitCodeOfSite(myday.getSiteId())) ).getValue();
//			System.out.println("max diff param: "+str_diff_param);
			diff_param=Integer.parseInt(str_diff_param);
			
			AgentDayBean tmp=new AgentDayBean();
			while(db.next()){
				rep=new ReplaceByCritrion();
				db.populate(rep);
//				System.out.println("rep id "+rep.getEmployeeId()+"---------");
				int len=SHFUtils.getMinutesBetween(rep.getStartTime(),rep.getEndTime());
				
				if( ! (Math.abs(len-mylen)<=diff_param) ){
//					System.out.println("not adding - MinutesBetween");
					continue;
				}
				
				//check if two inner jobs can switch one with the other
				if( ! SHFTableUtils.isInnerJobsSwitchable(myday.getInnerJobId(),rep.getInnerJob()) ){
//					System.out.println("not adding - InnerJobsSwitchable");
					continue;
				}
				/*	
				if(!(SHFTableUtils.isActivitiesEquals(rep.getActivity(),myday.getShiftActivity())))
					continue;
					*/
				if(rep.getStartTime().equals(myday.getShiftStart()) && rep.getEndTime().equals(myday.getShiftEnd())){
//					System.out.println("not adding - same times");
					continue;
				}
				
				// if this replace option is a night shift , check if sites are equal, else , ignore option.
				tmp.setWmShiftStartTime(rep.getStartTime());
				if(tmp.isNeightShift() && !rep.getSite().equals(myday.getSiteId())){
//					System.out.println("not adding - night shift and NOT same sites");
					continue;
				}
				
//				if(isBuildingFull(myday,rep)){ // morad not checking sit places --> seat checking moved to acceptOffer()
//					continue;
//				}
//				System.out.println("adding "+rep.getEmployeeId());
				vec.add(rep);
			}
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error on selectFirstCheckCandidates: " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in selectFirstCheckCandidates while closing db connection : " + e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
		return vec;
	}
	
	/**
	 *  Function to check time (parameter) between shifts
	 *  after switch with new shift
	 *
	 * @param candidates
	 * @param myday
	 * @return Vector <ReplaceByCritrion>
	 * @throws ShfException 
	 */
	public Vector <ReplaceByCritrion> checkShiftsInRange ( Vector <ReplaceByCritrion> candidates, AgentDayBean myday ) throws ShfException {
		logger.debug("ReplaceByCritrionDao: beginning of checkShiftsInRange()");
		Vector <ReplaceByCritrion> suitable = new Vector <ReplaceByCritrion>();
		if ( candidates == null || candidates.size() < 1 ) {
			return suitable;
		}
		Vector <AgentDayBean> candidates_vector = null;
		int param = 1;
		StringBuffer sql = new StringBuffer();
		
		sql.append("SELECT s.* ");
		sql.append("FROM shifter.shf_last_shifts_view s ");
		sql.append("LEFT JOIN shifter.shf_employees e ON substr(e.emp_id_number,1,8) = COALESCE(s.new_employee_id, s.emp_id_number) ");
		sql.append("WHERE COALESCE(s.new_employee_id, s.emp_id_number) IN ('"+myday.getEmpIdNumber()+"', ");
		for ( int i=0; i < candidates.size(); i++ ) {
			sql.append("'"+candidates.get(i).getEmployeePersonalId()+"'");
			if ( i < candidates.size()-1 ) {
				sql.append(", ");
			}
		}
		sql.append(" ) ");
		sql.append("AND COALESCE(s.new_shift_start, s.wm_shift_start_datetime) BETWEEN TRUNC(?+1,'IW')-1 AND TRUNC(?+1,'IW')+6 ");		// 1, 2
		sql.append("AND COALESCE(s.new_day_type, s.wm_day_type) = ? ");		// 3
		sql.append("ORDER BY COALESCE(s.new_employee_id, s.emp_id_number), COALESCE(s.new_shift_start, s.wm_shift_start_datetime) DESC ");
		
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement( sql.toString() );
			db.setDate( param++, myday.getShiftStart() );		// 1
			db.setDate( param++, myday.getShiftStart() );		// 2
			db.setInt( param++, SHFConstants.DAY_TYPE_ACTIVITY );	// 3
			db.executeQuery();
			candidates_vector = new Vector <AgentDayBean> ();
			db.populate( "bzq.shf.bean.AgentDayBean", candidates_vector );
		} catch ( DBQueryNoRowsException e ) {
//			System.out.println("Error in checkShiftsInRange() :  NO ROWS Exception !!");
			logger.error("NO ROWS Exception in checkShiftsInRange() : "+e.getMessage());
		} catch ( DBException e ) {
			logger.error("DB error in checkShiftsInRange() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch ( DBException e ) {
				logger.error( "DB Error in checkShiftsInRange() while closing DB connection : "+e.getMessage() );
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
		// check candidates shifts with myDay and vice versa
		Long myMinHours = SimpleFactoryDao.HOUR_IN_MILLI * Integer.parseInt( SHFParameters.getMinHoursBetweenShifts( SHFTableUtils.getUnitCodeOfSite( myday.getSiteId() ) ).getValue() );
		if ( candidates_vector != null && candidates_vector.size() > 0 ) {
			for ( int i=0; i < candidates.size(); i++ ) {	// 1st, for every candidate
//				System.out.println("candidate : "+candidates.get(i).getShiftId()+" , "+candidates.get(i).getStartTime()+" - "+candidates.get(i).getEndTime());
				Long candidateMinHours = SimpleFactoryDao.HOUR_IN_MILLI * Integer.parseInt( SHFParameters.getMinHoursBetweenShifts( SHFTableUtils.getUnitCodeOfSite( candidates.get(i).getSite() ) ).getValue() );
				boolean inRange = false;
				for ( int k=0; k < candidates_vector.size(); k++ ) {	// check myday in candidates week shifts
//					System.out.println(candidates.get(i).getEmployeePersonalId()+" - "+candidates_vector.get(k).getEmpIdNumber() );
					if ( candidates.get(i).getEmployeePersonalId().equals( candidates_vector.get(k).getEmpIdNumber()) ) { // get all week shifts for candidate
//						System.out.println("EQUALL !! "+candidates.get(i).getEmployeePersonalId()+" - "+candidates_vector.get(k).getEmpIdNumber());
						if ( ! ( candidates.get(i).getStartTime().equals( candidates_vector.get(k).getShiftStart() ) && candidates.get(i).getEndTime().equals( candidates_vector.get(k).getShiftEnd() ) ) ) {
//							System.out.println("candidate current shift : "+candidates_vector.get(k).getShiftStart()+" - "+candidates_vector.get(k).getShiftEnd() + ", my day : "+myday.getShiftStart()+" - "+myday.getShiftEnd());
							if (( myday.getShiftStart().after( new Date(candidates_vector.get(k).getShiftStart().getTime() - candidateMinHours)) && myday.getShiftStart().before(new Date(candidates_vector.get(k).getShiftEnd().getTime() + candidateMinHours)))
								||
								( myday.getShiftEnd().after( new Date(candidates_vector.get(k).getShiftStart().getTime() - candidateMinHours)) && myday.getShiftEnd().before(new Date(candidates_vector.get(k).getShiftEnd().getTime() + candidateMinHours)))	
							) {
								inRange = true;
//								System.out.println("in range in candidate week !");
							}
						}
					}
				}
				for ( int k=0; k < candidates_vector.size(); k++ ) {	// check candidates in myday week shifts
					if ( candidates_vector.get(k).getEmpIdNumber().equals( myday.getEmpIdNumber() ) ) { // get all week shifts for myday
						if ( ! ( myday.getShiftStart().equals(candidates_vector.get(k).getShiftStart()) && myday.getShiftEnd().equals(candidates_vector.get(k).getShiftEnd()) ) ) { // not include myday in my week shifts
							if ((candidates.get(i).getStartTime().after(new Date(candidates_vector.get(k).getShiftStart().getTime() - myMinHours)) && candidates.get(i).getStartTime().before(new Date(candidates_vector.get(k).getShiftEnd().getTime() + myMinHours)))
									||
								(candidates.get(i).getEndTime().after(new Date(candidates_vector.get(k).getShiftStart().getTime() - myMinHours)) && candidates.get(i).getStartTime().before(new Date(candidates_vector.get(k).getShiftEnd().getTime() + myMinHours)))
							) {
								inRange = true;
//								System.out.println("in range in MY week !");
							}
						}
					}
				}
				if ( ! inRange ) {
					suitable.add(candidates.get(i));
				}
			}
		}
		return suitable;
	}
	
	private boolean isBuildingFull(AgentDayBean myDay, AgentDayBean repDay) throws ShfException{
		String myteamCode = myDay.getOrgUnitCode();
		String repteamCode = repDay.getOrgUnitCode();
		BuildingModel buildingModel = new BuildingModel();
		BuildingForm myBuilding = null;
		BuildingForm repBuilding = null;
		Vector<AgentDayBean> myBuildingAgents = null;
		Vector<AgentDayBean> repBuildingAgents = null;
		Collection<AgentDayBean> largestIntersection = null;		
		
		if(myteamCode != null && ! myDay.isWorkingFromHome()){
			try{
				myBuilding=buildingModel.getBuildingByTeam(myteamCode);
				if(myBuilding != null){
				}else{
//					System.out.println("myBuilding is null - seat check will be skipped");
				}
			}catch (Exception e) {
				e.printStackTrace();
			}
		}else{
//			System.out.println("my team is empty");
		}
		
		if(repteamCode != null && ! repDay.isWorkingFromHome()){
			try{
				repBuilding = buildingModel.getBuildingByTeam(repteamCode);
				if(repBuilding != null){
				}else{
//					System.out.println("repBuilding is null - seat check will be skipped");
				}
			}catch (Exception e) {
				e.printStackTrace();
			}
		}else{
//			System.out.println("rep team is empty");
		}
		
		//if buildings are not set no need to check
			if(myBuilding == null && repBuilding == null){
//				System.out.println("both sites NULL, no seat check");
				return false;
			}
		
		//if same building no need to check
		if(myBuilding != null && repBuilding != null){
			if(myBuilding.getCode() == repBuilding.getCode()){
//				System.out.println("same sites for switch, no seat check");
				return false;
			}
		}
		//check if my building is full in the rep shift time
		if( myBuilding != null ){
//			System.out.println("1st site seats: "+myBuilding.getSeatsNum());
			if (myBuilding.getSeatsNum() == 0) return true; // zero seats prevents from agents to site switch
			myBuildingAgents = checkBuilding(myBuilding, repDay.getShiftStart(), repDay.getShiftEnd()); // get relevant agents in myBuilding within repDay shift time
			if( myBuildingAgents != null && myBuildingAgents.size() > 0 ){
//				System.out.println("1 relevant days: "+myBuildingAgents.size());
				Iterator<AgentDayBean> iter = myBuildingAgents.iterator(); //if exists, remove myDay from relevant agents (because he's switching with repDay)
				while (iter.hasNext()){
					AgentDayBean relevantDay = iter.next();
					if( relevantDay.getAgentDayId() == myDay.getAgentDayId() ){
//						System.out.println("1 removing "+relevantDay.getAgentDayId());
						iter.remove();
//						System.out.println("**1 new relevant days: "+myBuildingAgents.size());
					}
				}
				largestIntersection = getLargestIntersection(myBuildingAgents); // check max taken seats in myBuilding at repDay shift period
				if ( largestIntersection != null && largestIntersection.size() > 0 ){ // if max taken seats exists
//					System.out.println("1 max is: "+largestIntersection.size());
					if( largestIntersection.size() >= myBuilding.getSeatsNum() ){ // if max taken seats >= total seats in site then no switch
						logger.info("my site full, NO REPLACE"+", max taken seats: "+largestIntersection.size()+", total seats: "+myBuilding.getSeatsNum());
						return true;
					}
				}
			}else {
				if ( myBuilding.getSeatsNum() < 1 ){
//					System.out.println("1 no max taken seats, at least 1 free seat NOT exist > NOT switching");
					return true;
				}
			}
		}
		largestIntersection = null;
		//check if rep building is full in my shift time
		if(repBuilding != null){
//			System.out.println("2nd site seats: "+repBuilding.getSeatsNum());
			if (repBuilding.getSeatsNum() == 0) return true;
			repBuildingAgents = checkBuilding(repBuilding, myDay.getShiftStart(), myDay.getShiftEnd()); // get relevant agents in repBuilding within myDay shift time
			if(repBuildingAgents != null && repBuildingAgents.size() > 0){
//				System.out.println("2 relevant days: "+repBuildingAgents.size());
				Iterator<AgentDayBean> iter = repBuildingAgents.iterator(); //if exists, remove repDay from relevant agents (because he's switching with myDay)
				while (iter.hasNext()){
					AgentDayBean relevantDay = iter.next();
					if( relevantDay.getAgentDayId() == repDay.getAgentDayId() ){
//						System.out.println("2 removing "+relevantDay.getAgentDayId());
						iter.remove();
//						System.out.println("**2 new relevant days: "+repBuildingAgents.size());
					}
				}
				largestIntersection = getLargestIntersection(repBuildingAgents); // check max taken seats in repBuilding at myDay shift period
				if ( largestIntersection != null && largestIntersection.size() > 0 ){ // if max taken seats exists
//					System.out.println("2 max is: "+largestIntersection.size());
					if(largestIntersection.size() >= repBuilding.getSeatsNum()){ // if max taken seats >= total seats in site then no switch
						logger.info("rep site full, NO REPLACE"+", max taken seats: "+largestIntersection.size()+", total seats: "+myBuilding.getSeatsNum());
						return true;
					}
				}
			} else {
				if (  (repBuilding.getSeatsNum() < 1)){
//					System.out.println("2 no max taken seats, at least 1 free seat NOT exist > NOT switching");
					return true;
				}
			}
		}
//		System.out.println("switch success");
		return false;
	}
	
	////////////////
	private Collection<AgentDayBean> getLargestIntersection(Collection<AgentDayBean> agentDays) {
			
			//create a collection of agents sorted by start day
			Collection<AgentDayBean> largestAgentDayBeanIntersection = new ArrayList<AgentDayBean>();		
			
			if (agentDays != null && agentDays.size()>0) {
				
				Collection<AgentDayBean> sortedAgentDayBeans = new TreeSet<AgentDayBean>(new Comparator<AgentDayBean>() {
					public int compare(AgentDayBean o1, AgentDayBean o2) {
						
						if (!o1.getShiftStart().equals(o2.getShiftStart())) {
							return o1.getShiftStart().compareTo(o2.getShiftStart());
						}
						else if (!o1.getShiftEnd().equals(o2.getShiftEnd())) {
							return o1.getShiftEnd().compareTo(o2.getShiftEnd());
						}
						else {
							// allow duplication by returning 0
							return 1;
							
							//or else return some other comparison result of an attribute in AgentDayBean
						}
					}
				});
				
				sortedAgentDayBeans.addAll(agentDays);
				
				//iterate and keep on the side the largest collection
				List<AgentDayBean> tempAgentDayBeanIntersection = new ArrayList<AgentDayBean>();
				
				for (AgentDayBean agentBean:sortedAgentDayBeans) {
					
					//remove all beans not intersecting with current bean
					//use toArray to avoid concurrentModificationException
					for (AgentDayBean otherAgentBean:tempAgentDayBeanIntersection.toArray(new AgentDayBean[0])) {
						if (!otherAgentBean.getShiftEnd().after(agentBean.getShiftStart()) ||
								!otherAgentBean.getShiftStart().before(agentBean.getShiftEnd())) {

//						if (otherAgentBean.getShiftEnd().before(agentBean.getShiftStart()) ||
//								otherAgentBean.getShiftStart().after(agentBean.getShiftEnd())) {
							
							//remove other beans in in current interval
							tempAgentDayBeanIntersection.remove(otherAgentBean);
						}
					}
	
					//add the current bean
					tempAgentDayBeanIntersection.add(agentBean);
					
					//save if the list if it is the longest so far
					if (tempAgentDayBeanIntersection.size() > largestAgentDayBeanIntersection.size()) {
						largestAgentDayBeanIntersection.clear();
						largestAgentDayBeanIntersection.addAll(tempAgentDayBeanIntersection);
					}
				}
			}
			
			return largestAgentDayBeanIntersection;
		}
	
	///////////////
	/**
	 * check if the building is full at the other shift time
	 * @param myBuilding
	 * @param startTime
	 * @param endTime
	 * @return
	 * @throws ShfException 
	 */
	private Vector<AgentDayBean> checkBuilding(BuildingForm building, Date startTime, Date endTime) throws ShfException {
//		System.out.println("**********  "+building.getCode()+" from "+startTime+" to "+endTime);
		Vector<AgentDayBean> dayBeanVec = null;
//		int count=0;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT e.first_name, e.last_name, NVL(c.shf_employee_day_id, d.shf_employee_day_id) AS shf_employee_day_id , ");
		sql.append("c.new_shift_start, d.wm_shift_start_datetime, c.new_shift_end, d.wm_shift_end_datetime ");
		sql.append("FROM shifter.shf_employee_day d ");
		sql.append("LEFT JOIN SHIFTER.shf_day_changes c ON d.shf_employee_day_id = c.shf_employee_day_id ");
		sql.append("LEFT JOIN SHIFTER.shf_employees e ON substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("LEFT JOIN SHIFTER.shf_attendance a ON d.shf_employee_day_id = a.shf_employee_day_id ");
		sql.append("LEFT JOIN SHIFTER.shf_building_team t ON t.team_unit_code = e.org_unit_id ");
		sql.append("WHERE t.building_id = ? AND NVL(c.new_day_type,d.wm_day_type) = ? AND ("); //1+2
		sql.append("( NVL(c.new_shift_start, d.wm_shift_start_datetime) >= ? AND NVL(c.new_shift_start, d.wm_shift_start_datetime) < ? )  "); //start end 3+4
		sql.append(" OR ( NVL(c.new_shift_end, d.wm_shift_end_datetime) > ? AND NVL(c.new_shift_end, d.wm_shift_end_datetime) <= ? ) "); //start end 5+6
		sql.append(" OR ( NVL(c.new_shift_start, d.wm_shift_start_datetime) <= ? AND NVL(c.new_shift_end, d.wm_shift_end_datetime) >= ? ) "); //start end 7+8
		sql.append(")");
		int param=1;
		DBAccess dBAccess=null;		
		try{
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt		 (param++,building.getCode()); //1
			dBAccess.setInt		 (param++,SHFConstants.DAY_TYPE_ACTIVITY); //2
			dBAccess.setTimestamp(param++,startTime); //3
			dBAccess.setTimestamp(param++,endTime); //4
			dBAccess.setTimestamp(param++,startTime); //5
			dBAccess.setTimestamp(param++,endTime); //6
			dBAccess.setTimestamp(param++,startTime); //7
			dBAccess.setTimestamp(param++,endTime); //8
//			System.out.println("bld code: "+building.getCode()+", DAY_TYPE: "+SHFConstants.DAY_TYPE_ACTIVITY+", shift start: "+SHFUtils.formatDateToString(startTime, "dd/MM/yyyy HH:mm")+", end: "+SHFUtils.formatDateToString(endTime, "dd/MM/yyyy HH:mm"));
			dBAccess.executeQuery();
			dayBeanVec = new Vector<AgentDayBean>();
			dBAccess.populate("bzq.shf.bean.AgentDayBean", dayBeanVec);
//			count=dBAccess.getInt(1);
			return dayBeanVec;
		}catch (DBQueryNoRowsException e){
				
			
		}catch (DBException e) {
			logger.error("error on checkBuilding(): " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in checkBuilding() while closing db connection : " + e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return dayBeanVec;
	}

	
	
	/*
	private ReplaceByCritrion getCurrentShifts(ReplaceByCritrionOldNew replaceByCritrionOldNew){
		ReplaceByCritrion replaceByCritrion = null;
		replaceByCritrion = new ReplaceByCritrion();
		if (!SHFUtils.isEmpty(replaceByCritrionOldNew.getNewActivity()))
			replaceByCritrion.setActivity(replaceByCritrionOldNew.getNewActivity());
		else
			replaceByCritrion.setActivity(replaceByCritrionOldNew.getActivity());
			
		if (!SHFUtils.isEmpty(replaceByCritrionOldNew.getNewEmployeePerId()))
			replaceByCritrion.setEmployeePersonalId(replaceByCritrionOldNew.getNewEmployeePerId());
		else
			replaceByCritrion.setEmployeePersonalId(replaceByCritrionOldNew.getEmployeePerId());						
			
		if (replaceByCritrionOldNew.getNewStartTime()!=null)
			replaceByCritrion.setStartTime(replaceByCritrionOldNew.getNewStartTime());
		else
			replaceByCritrion.setStartTime(replaceByCritrionOldNew.getStartTime());						

		if (replaceByCritrionOldNew.getNewEndTime()!=null)
			replaceByCritrion.setEndTime(replaceByCritrionOldNew.getNewEndTime());
		else
			replaceByCritrion.setEndTime(replaceByCritrionOldNew.getEndTime());
			
		if (!SHFUtils.isEmpty(replaceByCritrionOldNew.getNewFullname()) && !" ".equals(replaceByCritrionOldNew.getNewFullname()))
			replaceByCritrion.setFullname(replaceByCritrionOldNew.getNewFullname());
		else
			replaceByCritrion.setFullname(replaceByCritrionOldNew.getFullname());						
									
		if (!SHFUtils.isEmpty(replaceByCritrionOldNew.getNewEmployeeId()))
			replaceByCritrion.setEmployeeId(replaceByCritrionOldNew.getNewEmployeeId());
		else
			replaceByCritrion.setEmployeeId(replaceByCritrionOldNew.getEmployeeId());						
									
		replaceByCritrion.setShiftId(String.valueOf(replaceByCritrionOldNew.getEmployeeDayId()));
		return replaceByCritrion;
	}*/
	

	/* (non-Javadoc)
	 * @see bzq.shf.dao.SimpleFactoryDao#insertShiftToReplace(bzq.forms.BaseForm)
	 */
	public boolean insertShiftToReplace(String myShiftId,String offerToShift,String status, String note) throws ShfException {
		logger.debug("insertShiftToReplace");

		boolean isInsertShiftToReplace = false;
		//ReplaceByCritrion replaceByCritrion = null;
		StringBuffer sql1 = new StringBuffer();
		sql1.append("INSERT INTO SHIFTER.SHF_REPLACE_CANDIDATES (SHF_EMPLOYEE_DAY_ID, STATUS, CREATION_DATE "
				+(offerToShift != null ? ",OFFER " : "")
				+((note != null && note != "") ? ",NOTE " : "")
				+") VALUES (?,?,?"
				+(offerToShift != null ? ",? " : "")
				+((note != null && note != "") ? ",? " : "")
				+")");

//		StringBuffer sql = new StringBuffer();
//		if (offerToShift!=null)
//			sql.append("INSERT INTO SHIFTER.SHF_REPLACE_CANDIDATES (SHF_EMPLOYEE_DAY_ID,STATUS,CREATION_DATE,OFFER) VALUES (?,?,?,?)");
//		else
//			sql.append("INSERT INTO SHIFTER.SHF_REPLACE_CANDIDATES (SHF_EMPLOYEE_DAY_ID,STATUS,CREATION_DATE) VALUES (?,?,?)");
			
		DBAccess dBAccess=null;
		int index = 1;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql1.toString());
			dBAccess.setInt(index++,Integer.parseInt(myShiftId));
			dBAccess.setString(index++,status);
			dBAccess.setTimestamp(index++,new Timestamp(System.currentTimeMillis()));
			if (offerToShift != null) {
				dBAccess.setInt(index++,Integer.parseInt(offerToShift));
			}
			if (note != null && note != "") {
				dBAccess.setString(index++,note);
			}
			if (dBAccess.executeUpdate()==1)
				isInsertShiftToReplace = true;		
		} catch (DBException e) {
			logger.error("error on insertShiftToReplace insert " + e.getMessage());
			throw new ShfException("error on insertShiftToReplace insert", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		
	return isInsertShiftToReplace;
	}
	
	public boolean insertShiftsToReplaceForSwitch(String myShiftId, Vector<String> offerToShifts) throws ShfException {
		boolean isInsertSuccess = false;
		if (myShiftId == null || offerToShifts == null || offerToShifts.size() == 0) return isInsertSuccess;
		
		StringBuffer sql = new StringBuffer();
		sql.append("INSERT ALL ");
		Iterator<String> iter = offerToShifts.iterator();
		while ( iter.hasNext() ) {
			iter.next();
			sql.append("INTO SHIFTER.SHF_REPLACE_CANDIDATES (SHF_EMPLOYEE_DAY_ID,STATUS,CREATION_DATE,OFFER) VALUES (?,?,?,?) ");
		}
		sql.append("SELECT * FROM DUAL");
		
//			Iterator<String> iter = offerToShifts.iterator();
//			while ( iter.hasNext() ) {
//				iter.next();
//				sql.append(" (?,?,?,?) ");
//				if (iter.hasNext()) {
//					sql.append(", ");
//				}
//			}
//			sql.append(";");
			
			int index = 1;
			DBAccess dBAccess=null;
			try {
				dBAccess=new DBAccess();
				dBAccess.prepareStatement(sql.toString());
				for (int i=0; i<offerToShifts.size(); i++) {
					dBAccess.setInt(index++, Integer.parseInt(myShiftId));
					dBAccess.setString(index++, WAIT_FOR_ANS_STATUS);
					dBAccess.setTimestamp(index++, new Timestamp(System.currentTimeMillis()));
					dBAccess.setInt(index++, Integer.parseInt(offerToShifts.get(i)));

				}

			int dbResult = dBAccess.executeUpdate();
			if (dbResult > 0) isInsertSuccess = true;	
						
			} catch (DBException e) {
				logger.error("error on insertShiftsToReplaceForSwitch()  " + e.getMessage());
				throw new ShfException("error on insertShiftsToReplaceForSwitch()", e);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					throw new ShfException("insertShiftsToReplaceForSwitch() while db.close()", e);
				}
			}

		return isInsertSuccess;
		
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.SimpleFactoryDao#updateOfferShift(java.lang.String, java.lang.String)
	 */
	public boolean updateOfferShift(String myShiftId, String offerToShift) throws ShfException {
		logger.debug("ReplaceByCritrionDao: updateOfferShift");
		
		boolean isUpdateOfferShift = false;		


		StringBuffer sql1=new StringBuffer();
		sql1.append("SELECT * FROM SHIFTER.SHF_REPLACE_CANDIDATES t WHERE t.shf_employee_day_id=? and t.status=?");
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();

			dBAccess.prepareStatement(sql1.toString());
			dBAccess.setInt(1,Integer.parseInt(myShiftId));
			dBAccess.setString(2,OPEN_REPLACE_STATUS);
			dBAccess.executeQuery();
			
			if (dBAccess.next())	{
				StringBuffer sql2=new StringBuffer();
				sql2.append("UPDATE SHIFTER.SHF_REPLACE_CANDIDATES SET OFFER=?,MODIFIED_DATE=?,STATUS=? WHERE shf_employee_day_id=?");

				try {

					dBAccess.prepareStatement(sql2.toString());
					dBAccess.setInt(1,Integer.parseInt(offerToShift));
					dBAccess.setTimestamp(2,new Timestamp(System.currentTimeMillis()));
					dBAccess.setString(3,WAIT_FOR_ANS_STATUS);
					dBAccess.setInt(4,Integer.parseInt(myShiftId));		
					if (dBAccess.executeUpdate()==1)
						isUpdateOfferShift = true;		
				} catch (DBException e) {
					logger.error("error on ReplaceByCritrionDao updateOfferShift " + e.getMessage());
					throw new ShfException("error on ReplaceByCritrionDao updateOfferShift", e);
				} finally{
					try {
						dBAccess.close();
					} catch (DBException e) {
						throw new ShfException("db.close()", e);
					}
				}
				return isUpdateOfferShift;
				
			}					
		} catch(DBQueryNoRowsException e){
			return insertShiftToReplace(myShiftId,offerToShift,WAIT_FOR_ANS_STATUS,"");				
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao updateOfferShift " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao updateOfferShift", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}

		return isUpdateOfferShift;
	}


	/* (non-Javadoc)
	 * @see bzq.shf.dao.SimpleFactoryDao#updateOfferShift(java.lang.String, java.lang.String)
	 */
	public boolean cancelOfferShift(String myShiftId, String offerToShift) throws ShfException {
		logger.debug("ReplaceByCritrionDao: cancelOfferShift");
		
		boolean isCancelOfferShift = false;		


		StringBuffer sql1=new StringBuffer();
		sql1.append("SELECT * FROM SHIFTER.SHF_REPLACE_CANDIDATES t WHERE t.shf_employee_day_id=? and t.status=?" /*and t.offer=?*/ );	// Igal 2.2015 multiple offers update
//		sql1.append("for update");	// Igal 2.2015 multiple offers update
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess(false);

			dBAccess.prepareStatement(sql1.toString());
			dBAccess.setInt(1,Integer.parseInt(myShiftId));
			dBAccess.setString(2,WAIT_FOR_ANS_STATUS);
//			dBAccess.setInt(3,Integer.parseInt(offerToShift));	// Igal 2.2015 multiple offers update
			dBAccess.executeQuery();
			Vector<OfferReplaceByCritrion> result = new Vector<OfferReplaceByCritrion>();
			dBAccess.populate("bzq.shf.transfer.ReplaceCandidates",result);
			
			if ( result.size() > 0 )	{
				StringBuffer sql2=new StringBuffer();
				
				if ( result.size() > 1 ) {	// if offerer has offered to others as well then delete only offer to me, and leave other offers in WAIT_FOR_ANS status
					sql2.append("DELETE FROM SHIFTER.SHF_REPLACE_CANDIDATES c ");
					sql2.append("WHERE c.offer = ? ");	//	1
					sql2.append("AND c.status = ? ");	//	2
					sql2.append("AND c.shf_employee_day_id = ? "); // 3
					
					dBAccess.prepareStatement(sql2.toString());
					dBAccess.setInt(1,Integer.parseInt(offerToShift));
					dBAccess.setString(2,WAIT_FOR_ANS_STATUS);
					dBAccess.setInt(3,Integer.parseInt(myShiftId));
					
				} else {	// if offered to me ONLY, then set his status to OPEN
					sql2.append("UPDATE SHIFTER.SHF_REPLACE_CANDIDATES t SET STATUS=?,MODIFIED_DATE=?,OFFER=? WHERE t.shf_employee_day_id=? and t.offer=?");

					dBAccess.prepareStatement(sql2.toString());
					dBAccess.setString(1,OPEN_REPLACE_STATUS);
					dBAccess.setTimestamp(2,new Timestamp(System.currentTimeMillis()));
					dBAccess.setString(3,"");
					dBAccess.setInt(4,Integer.parseInt(myShiftId));
					dBAccess.setInt(5,Integer.parseInt(offerToShift));	
				}
				try {
					if (dBAccess.executeUpdate()==1)	{
						dBAccess.commit();
						isCancelOfferShift = true;
					}								
				} catch (DBException e) {
					dBAccess.rollback();
					logger.error("error on ReplaceByCritrionDao cancelOfferShift() " + e.getMessage());
					throw new ShfException("error on ReplaceByCritrionDao cancelOfferShift", e);
				} finally{
					try {
						dBAccess.close();
					} catch (DBException e) {
						throw new ShfException("db.close()", e);
					}
				}
				return isCancelOfferShift;
				
			}
													
		} catch(DBQueryNoRowsException e){
			try {
				dBAccess.rollback();
			} catch (DBException e1) {
				e1.printStackTrace();
			}
			logger.error("error on ReplaceByCritrionDao cancelOfferShift cant cancel shift" + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao cancelOfferShift cant cancel shift", e);				
		} catch (DBException e) {
			try {
				dBAccess.rollback();
			} catch (DBException e1) {
				e1.printStackTrace();
			}
			logger.error("error on ReplaceByCritrionDao cancelOfferShift " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao cancelOfferShift", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}

		return isCancelOfferShift;
	}


	public Vector<ReplaceByCritrion> selectReplacementOffer(String myShiftId) throws ShfException {
		Vector<ReplaceByCritrion> replacementOffer = null;
		logger.debug("ReplaceByCritrionDao: selectReplacementOffer");

		ReplaceByCritrion replaceByCritrion = null;

		StringBuffer sql=new StringBuffer();
		sql.append("select t.shf_employee_day_id,nvl(d.new_shift_start,t.wm_shift_start_datetime) as starttime,nvl(d.new_shift_end,t.wm_shift_end_datetime) as endtime,nvl(d.new_activity,t.wm_sch_activity_id_data) as activity,nvl(d.new_employee_id,t.emp_id_number) as emp_id_number,");
		sql.append("e1.employee_id,e1.first_name||' '||e1.last_name as fullname,e1.inner_job_id,e1.manager_id,e1.org_unit_id, nvl(d.new_site_id,t.wm_site_id) as site ");
		sql.append("from SHIFTER.shf_employee_day t ");
		sql.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_replace_candidates c1 on t.shf_employee_day_id=c1.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e1 on nvl(d.new_employee_id,t.emp_id_number)=substr(e1.emp_id_number,1,8) ");
		sql.append("where c1.status = ? ");
		sql.append("and c1.offer = ? ");
		
		DBAccess dBAccess=null;		
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());			
			dBAccess.setString(1,WAIT_FOR_ANS_STATUS);
			dBAccess.setLong(2,Long.valueOf(myShiftId));			
			dBAccess.executeQuery();
			replacementOffer = new Vector();
			while (dBAccess.next())	{
				replaceByCritrion = new ReplaceByCritrion();
				dBAccess.populate(replaceByCritrion);
				replacementOffer.add(replaceByCritrion);
			}														
		} catch(DBQueryNoRowsException e){			
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao selectReplacementOffer " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao selectReplacementOffer", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		return replacementOffer;
	}
	
	/**
	 * Same function as selectReplacementOffer() but returns Vector of OfferReplaceByCritrion instead ReplaceByCritrion
	 * @param myShiftId String
	 * @return Vector <OfferReplaceByCritrion>
	 * @throws ShfException
	 */
	
	
	public Vector<OfferReplaceByCritrion> selectReplacementOffer( Vector<String> shiftsIdVec ) throws ShfException {
		logger.debug("ReplaceByCritrionDao: selectReplacementOffer( Vector<String> myShiftId )");
		
		Vector<OfferReplaceByCritrion> result = null;
		
		if (shiftsIdVec == null ) return result;

		OfferReplaceByCritrion replaceByCritrion = null;

		StringBuffer sql = new StringBuffer();
		sql.append("select t.shf_employee_day_id,nvl(d.new_shift_start,t.wm_shift_start_datetime) as starttime,nvl(d.new_shift_end,t.wm_shift_end_datetime) as endtime,nvl(d.new_activity,t.wm_sch_activity_id_data) as activity,nvl(d.new_employee_id,t.emp_id_number) as emp_id_number,");
		sql.append("e1.employee_id,e1.first_name||' '||e1.last_name as fullname,e1.inner_job_id,e1.manager_id,e1.org_unit_id, nvl(d.new_site_id,t.wm_site_id) as site, c1.offer ");
		sql.append("from SHIFTER.shf_employee_day t ");
		sql.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_replace_candidates c1 on t.shf_employee_day_id=c1.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e1 on nvl(d.new_employee_id,t.emp_id_number)=substr(e1.emp_id_number,1,8) ");
		sql.append("where c1.status = ? ");
		sql.append("and c1.offer in ( ");
		Iterator<String> it = shiftsIdVec.iterator();
		while ( it.hasNext() ) {
			sql.append( it.next() );
			if ( it.hasNext() ) 
				sql.append(","); 
		}
		sql.append(" ) ");
		
		DBAccess dBAccess = null;		
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());			
			dBAccess.setString(1,WAIT_FOR_ANS_STATUS);
			dBAccess.executeQuery();
			result = new Vector<OfferReplaceByCritrion>();
			while (dBAccess.next())	{
				replaceByCritrion = new OfferReplaceByCritrion();
				dBAccess.populate(replaceByCritrion);
				result.add(replaceByCritrion);
			}														
		} catch(DBQueryNoRowsException e){			
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao selectReplacementOffer " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao selectReplacementOffer( Vector<String> myShiftId )", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		return result;
		
	}
	
	/**
	 * Function to remove my shift from other offers to me (after switch other offers to me are irrelevant)
	 * if offerer offered to me only set his status to OPEN, else remove my shift from his offers
	 * 
	 * @param myShiftId my shift id (the accept shift)
	 * @return boolean true if update successful
	 * @author 31180049
	 */
	public boolean updateReplacementOfferToOpen(String myShiftId, String offerShiftId) throws ShfException {
		logger.debug("ReplaceByCritrionDao: updateReplacementOfferToOpen");
		
		boolean isUpdateReplacementOfferToOpen = false;
		
//		// Igal 2.2015 multiple offers update NEW CODE
		// 1st get all offers to me
		StringBuffer sql1 = new StringBuffer();
		sql1.append("SELECT * FROM shifter.shf_replace_candidates c ");
		sql1.append("WHERE c.shf_employee_day_id in ");
		sql1.append("( ");
		sql1.append("	SELECT t.shf_employee_day_id FROM shifter.shf_replace_candidates t ");
		sql1.append("	WHERE t.offer in (?, ?) ");	// 1, 2
		sql1.append(") ");
		sql1.append("ORDER BY c.creation_date desc ");
		
		DBAccess dBAccess = null;
		Vector<ReplaceCandidates> result = null;
		
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql1.toString());
			
			dBAccess.setInt(1, Integer.parseInt(myShiftId));	// 1
			dBAccess.setInt(2, Integer.parseInt(offerShiftId));	// 2
			
			dBAccess.executeQuery();
			result = new Vector<ReplaceCandidates>();
			dBAccess.populate("bzq.shf.transfer.ReplaceCandidates",result);
		} catch (DBException e) {
			logger.error("DB error on ReplaceByCritrionDao updateReplacementOfferToOpen() : " + e.getMessage());
			throw new ShfException("DB error on ReplaceByCritrionDao updateReplacementOfferToOpen()", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("ReplaceByCritrionDao updateReplacementOfferToOpen while dBAccess.close()", e);
			}
		}
		
		// 2nd , now that we have all offers to me, lets decide if set them to OPEN (offerer only offered to me) or just delete offer to me ( offerer also offered to others )
		
		// IF offerer has more then 2 offers then we only delete both offers (to me and to whom i'm switched with)
		// IF he has two offers : then need to check if both ours (to me and to whom i'm switched with) in that case need to set him to OPEN after deleting one row, or only one is relevant (or to me or to whom i'm switched with)
		// in that case delete only relevant row from the two
		// IF only 1 offer then just set OPEN
		Vector<Integer> delete	= new Vector<Integer>();
		Vector<Integer> toOpen	= new Vector<Integer>();
		Vector<Integer> singleDelete	= new Vector<Integer>();
		
		if ( result != null && result.size() > 0 ) {
			for (int i = 0; i < result.size(); i++) {
				if ( ! delete.contains(result.get(i).getShiftId()) && ! toOpen.contains(result.get(i).getShiftId()) ) {
					int occurrences = 0;
					int relevantOffers = 0;
					for (int n = 0; n < result.size(); n++) {
						if ( result.get(i).getShiftId() == result.get(n).getShiftId() ) {
							occurrences++;
							if ( result.get(n).getOffer() == Integer.parseInt(myShiftId) || result.get(n).getOffer() == Integer.parseInt(offerShiftId) ) {
								relevantOffers++;
							}
						}
					}
					if (occurrences > 2 || (occurrences == 2 && relevantOffers < 2) ) {
						delete.add(result.get(i).getShiftId());
					} else if (occurrences == 2 && relevantOffers == 2) {
						singleDelete.add(result.get(i).getShiftId());
						toOpen.add(result.get(i).getShiftId());
					} else if (occurrences < 2) {
						toOpen.add(result.get(i).getShiftId());
					}
				}
			}
		}
		
		// 3rd now that we know which offers need to be set to OPEN or DELETED lets update the DB accordingly
		StringBuffer sql = null;
		if (delete.size() > 0 || singleDelete.size() > 0) {
			sql = new StringBuffer();
			sql.append("DELETE FROM shifter.shf_replace_candidates c WHERE c.shf_employee_day_id in ( ");
		}
		
		if ( delete.size() > 0 ) {
			
			for (int i = 0; i < delete.size(); i++) {
				sql.append("?");
				if ( i < delete.size()-1 ) {
					sql.append(", ");
				}
			}
			sql.append(") ");
			sql.append("AND c.offer in ( ?, ?)");
			
			try {
				int index = 1;
				dBAccess = new DBAccess();
				dBAccess.prepareStatement(sql.toString());
				
				for (int i = 0; i < delete.size(); i++) {
					dBAccess.setInt(index++, delete.get(i));
				}
				dBAccess.setInt(index++, Integer.parseInt(myShiftId));
				dBAccess.setInt(index++, Integer.parseInt(offerShiftId));
				
				dBAccess.executeUpdate();
				
			} catch (DBException e) {
				logger.error("DB error on ReplaceByCritrionDao updateReplacementOfferToOpen() while DELETE : " + e.getMessage());
				throw new ShfException("DB error on ReplaceByCritrionDao updateReplacementOfferToOpen()", e);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					throw new ShfException("ReplaceByCritrionDao updateReplacementOfferToOpen while dBAccess.close()", e);
				}
			}
		}
		
		if ( singleDelete.size() > 0 ) {
			for (int i = 0; i < singleDelete.size(); i++) {
				sql.append("?");
				if ( i < singleDelete.size()-1 ) {
					sql.append(", ");
				}
			}
			sql.append(") ");
			sql.append("AND c.offer = ? ");
			
			try {
				int index = 1;
				dBAccess = new DBAccess();
				dBAccess.prepareStatement(sql.toString());
				
				for (int i = 0; i < singleDelete.size(); i++) {
					dBAccess.setInt(index++, singleDelete.get(i));
				}
				dBAccess.setInt(index++, Integer.parseInt(myShiftId));
				
				dBAccess.executeUpdate();
				
			} catch (DBException e) {
				logger.error("DB error on ReplaceByCritrionDao updateReplacementOfferToOpen() while SECOND DELETE : " + e.getMessage());
				throw new ShfException("DB error on ReplaceByCritrionDao updateReplacementOfferToOpen()", e);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					throw new ShfException("ReplaceByCritrionDao updateReplacementOfferToOpen while dBAccess.close()", e);
				}
			}
		}
		
		if ( toOpen.size() > 0 ) {
			StringBuffer sql2 = new StringBuffer();
			sql2.append("UPDATE shifter.shf_replace_candidates c SET c.STATUS=?, c.MODIFIED_DATE=?, c.OFFER=? "); // 1, 2, 3
			sql2.append("WHERE c.shf_employee_day_id in ( ");
			for (int i = 0; i < toOpen.size(); i++) {
				sql2.append("?");
				if ( i < toOpen.size()-1 ) {
					sql2.append(", ");
				}
			}
			sql2.append(") ");
			
			try {
				int index = 1;
				dBAccess = new DBAccess();
				dBAccess.prepareStatement(sql2.toString());
				
				dBAccess.setString(index++,OPEN_REPLACE_STATUS);	// 1
				dBAccess.setTimestamp(index++,new Timestamp(System.currentTimeMillis()));	// 2
				dBAccess.setString(index++,"");		// 3
				for (int i = 0; i < toOpen.size(); i++) {
					dBAccess.setInt(index++, toOpen.get(i));
				}
				
				dBAccess.executeUpdate();
				
			} catch (DBException e) {
				logger.error("error on ReplaceByCritrionDao updateReplacementOfferToOpen while set to OPEN" + e.getMessage());
				throw new ShfException("error on ReplaceByCritrionDao updateReplacementOfferToOpen", e);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					throw new ShfException("db.close()", e);
				}
			}
		}	
		
		// Igal 2.2015 multiple offers update OLD CODE
//		StringBuffer sql=new StringBuffer();
//		sql.append("UPDATE SHIFTER.SHF_REPLACE_CANDIDATES SET STATUS=?,MODIFIED_DATE=?,OFFER=? WHERE OFFER=?");
//
//		DBAccess dBAccess=null;		
//		try {
//			dBAccess=new DBAccess();
//
//			dBAccess.prepareStatement(sql.toString());
//			dBAccess.setString(1,OPEN_REPLACE_STATUS);
//			dBAccess.setTimestamp(2,new Timestamp(System.currentTimeMillis()));
//			dBAccess.setString(3,"");
//			dBAccess.setInt(4,Integer.parseInt(myShiftId));		
//			if (dBAccess.executeUpdate()>0)	{				
//				isUpdateReplacementOfferToOpen = true;
//			}								
//		} catch (DBException e) {
//			logger.error("error on ReplaceByCritrionDao updateReplacementOfferToOpen " + e.getMessage());
//			throw new ShfException("error on ReplaceByCritrionDao updateReplacementOfferToOpen", e);
//		} finally{
//			try {
//				dBAccess.close();
//			} catch (DBException e) {
//				throw new ShfException("db.close()", e);
//			}
//		}
		return isUpdateReplacementOfferToOpen = true; 

	}
	
	public boolean updateReplacementOfferToOpen( String myShiftId, Vector<OfferReplaceByCritrion> offers ) throws ShfException {
		logger.debug("ReplaceByCritrionDao: updateReplacementOfferToOpen( String myShiftId, Vector<OfferReplaceByCritrion> offers )");			
		boolean isUpdateSuccessful = false;
		if ( myShiftId == null ||  offers == null || offers.size() < 1 ) return isUpdateSuccessful;
		
		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_REPLACE_CANDIDATES c SET STATUS=?,MODIFIED_DATE=?,OFFER=? ");	//	1, 2, 3
		sql.append("WHERE c.OFFER = ? ");	// 4
		sql.append("AND c.shf_employee_day_id in ( ");
		Iterator<OfferReplaceByCritrion> iter = offers.iterator();
		while ( iter.hasNext() ) {
			sql.append( iter.next().getShiftId() );
			if ( iter.hasNext() ) {
				sql.append(",");
			}
		}
		sql.append(")");

		DBAccess dBAccess=null;		
		try {
			dBAccess=new DBAccess();

			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,OPEN_REPLACE_STATUS);	// 1
			dBAccess.setTimestamp(2,new Timestamp(System.currentTimeMillis()));	//	2
			dBAccess.setString(3,"");	//	3
			dBAccess.setInt(4,Integer.parseInt(myShiftId));		//	4
			if (dBAccess.executeUpdate()>0)	{				
				isUpdateSuccessful = true;
			}								
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao updateReplacementOfferToOpen( String myShiftId, Vector<OfferReplaceByCritrion> offers ) " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao updateReplacementOfferToOpen( String myShiftId, Vector<OfferReplaceByCritrion> offers ) ", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("updateReplacementOfferToOpen( String myShiftId, Vector<OfferReplaceByCritrion> offers ) while db.close() ", e);
			}
		}
		return isUpdateSuccessful; 

	}

	public boolean deleteShiftFromRepository(String myShiftId) throws ShfException {
		logger.debug("ReplaceByCritrionDao: updateReplacementOfferToOpen");
			
		StringBuffer sql=new StringBuffer();
		boolean isDeleteShiftFromRepository = false;
		sql.append("DELETE FROM SHIFTER.SHF_REPLACE_CANDIDATES WHERE shf_employee_day_id=?");

		DBAccess dBAccess=null;		
		try {
			dBAccess=new DBAccess();

			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,myShiftId);
			if (dBAccess.executeUpdate()==1)	{				
				isDeleteShiftFromRepository = true;
			}								
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao updateReplacementOfferToOpen " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao updateReplacementOfferToOpen", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return isDeleteShiftFromRepository; 
	}
	
	public boolean deleteOffersToMeFromRepository(String myShiftId, Vector<OfferReplaceByCritrion> offers) throws ShfException {
		logger.debug("ReplaceByCritrionDao: deleteOffersToMeFromRepository");
		boolean isDeleteSuccessful = false;
		if ( myShiftId == null ||  offers == null || offers.size() < 1 ) return isDeleteSuccessful;
		
		StringBuffer sql = new StringBuffer();

		sql.append("DELETE FROM SHIFTER.SHF_REPLACE_CANDIDATES c ");
		sql.append("WHERE c.offer = ? ");	//	1
		sql.append("AND c.status = ? ");	//	2
		sql.append("AND c.shf_employee_day_id in (");
		Iterator<OfferReplaceByCritrion> iter = offers.iterator();
		while ( iter.hasNext() ) {
			sql.append( iter.next().getShiftId() );
			if ( iter.hasNext() ) {
				sql.append(",");
			}
		}
		sql.append(")");

		DBAccess dBAccess=null;		
		try {
			dBAccess=new DBAccess();

			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(1,Integer.parseInt(myShiftId));	//	1
			dBAccess.setString(2,WAIT_FOR_ANS_STATUS);		//	2
			if (dBAccess.executeUpdate()==1)	{				
				isDeleteSuccessful = true;
			}								
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao deleteOffersToMeFromRepository() " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao deleteOffersToMeFromRepository() ", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("error on ReplaceByCritrionDao deleteOffersToMeFromRepository() while db.close() ", e);
			}
		}
		return isDeleteSuccessful; 
	}

	public boolean updateMyShiftToCancelReplace(String myShiftId,String status) throws ShfException {
		logger.debug("ReplaceByCritrionDao: updateMyShiftToCancelReplace");
		
		StringBuffer sql=new StringBuffer();
		boolean isUpdateMyShiftToCancelReplace = false;
		sql.append("UPDATE SHIFTER.SHF_REPLACE_CANDIDATES SET STATUS=? WHERE shf_employee_day_id=?");

		DBAccess dBAccess=null;		
		try {
			dBAccess=new DBAccess();

			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,status);
			dBAccess.setString(2,myShiftId);
			if ( dBAccess.executeUpdate() > 0)	{				
				isUpdateMyShiftToCancelReplace = true;
			}								
		}catch (DBUpdateNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao updateMyShiftToCancelReplace " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao updateMyShiftToCancelReplace", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return isUpdateMyShiftToCancelReplace; 		
	}

	public boolean rejectReplaceOffer(String fromShiftId, String toShiftId,String status,String existStatus) throws ShfException {
		logger.debug("ReplaceByCritrionDao: rejectReplaceOffer");
		
		boolean isRejectReplaceOffer = false;		
		Vector<OfferReplaceByCritrion> result = null;

		StringBuffer sql1=new StringBuffer();
		sql1.append("SELECT * FROM SHIFTER.SHF_REPLACE_CANDIDATES t WHERE t.shf_employee_day_id=? and t.status=?" /*and t.offer=?*/ );	// Igal 2.2015 multiple offers update
		// sql1.append("for update"); // Igal 2.2015 multiple offers update
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess(false);
			dBAccess.prepareStatement(sql1.toString());
			dBAccess.setInt(1,Integer.parseInt(toShiftId));
			dBAccess.setString(2,existStatus);
//			dBAccess.setInt(3,Integer.parseInt(fromShiftId));	// Igal 2.2015 multiple offers update
			dBAccess.executeQuery();
			result = new Vector<OfferReplaceByCritrion>();
			dBAccess.populate("bzq.shf.transfer.ReplaceCandidates",result);
			
			if ( result.size() > 0 )	{
				
				StringBuffer sql2=new StringBuffer();
				
				if ( result.size() > 1 ) {	// if offerer has offered to others as well then delete only offer to me, and leave other offers in WAIT_FOR_ANS status
					sql2.append("DELETE FROM SHIFTER.SHF_REPLACE_CANDIDATES c ");
					sql2.append("WHERE c.offer = ? ");	//	1
					sql2.append("AND c.status = ? ");	//	2
					sql2.append("AND c.shf_employee_day_id = ? "); // 3
					
					dBAccess.prepareStatement(sql2.toString());
					dBAccess.setInt(1,Integer.parseInt(fromShiftId));
					dBAccess.setString(2,WAIT_FOR_ANS_STATUS);
					dBAccess.setInt(3,Integer.parseInt(toShiftId));
					
				} else {	// if offered to me ONLY, then set his status to OPEN
					sql2.append("UPDATE SHIFTER.SHF_REPLACE_CANDIDATES SET STATUS=?,MODIFIED_DATE=?,OFFER=? WHERE shf_employee_day_id=? and offer=?");
					dBAccess.prepareStatement(sql2.toString());
					dBAccess.setString(1,status);
					dBAccess.setTimestamp(2,new Timestamp(System.currentTimeMillis()));
					dBAccess.setString(3,"");
					dBAccess.setInt(4,Integer.parseInt(toShiftId));
					dBAccess.setInt(5,Integer.parseInt(fromShiftId));
				}
	
				try {
					
					if (dBAccess.executeUpdate()==1)	{
						dBAccess.commit();
						isRejectReplaceOffer = true;
					}								
				} catch (DBException e) {
					logger.error("error on ReplaceByCritrionDao rejectReplaceOffer " + e.getMessage());
					throw new ShfException("error on ReplaceByCritrionDao rejectReplaceOffer", e);
				} finally{
					try {
						dBAccess.close();
					} catch (DBException e) {
						throw new ShfException("db.close()", e);
					}
				}
				
			}
														
		} catch(DBQueryNoRowsException e){
			logger.error("error on ReplaceByCritrionDao rejectReplaceOffer cant reject shift" + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao rejectReplaceOffer cant reject shift", e);				
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao rejectReplaceOffer " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao rejectReplaceOffer", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}

		return isRejectReplaceOffer;
	}

	public boolean acceptReplaceOffer(BaseForm bf, String status, String existStatus, ServletContext sCtx) throws ShfException {
		
		//TODO - HASAVA - acceptReplaceOffer
		logger.debug("ReplaceByCritrionDao: acceptReplaceOffer()");
		// START check seat availability
		OfferReplaceByCritrion acceptShift = (OfferReplaceByCritrion)bf;
		AgentDayBean myDay = ShiftDataModel.populateShift(Long.valueOf(acceptShift.getShiftId())); // agent that accepted
		AgentDayBean OfferDay = ShiftDataModel.populateShift(Long.valueOf(acceptShift.getOffer())); // agent that offered
		if (  isBuildingFull(myDay, OfferDay) ) { // check available seats
			logger.info("Switch failed, no available seats at site while switching day id: "+myDay.getAgentDayId()+" with day id: "+OfferDay.getAgentDayId());
			ActionError actionError = new ActionError("shf.error.siteFullForSwitch");
			throw new ShfException(actionError);
		}
		// END check seat availability 
		boolean isAcceptReplaceOffer = false;
		int fromShiftIdInt;
		int toShiftIdInt;
		ReplaceShift replaceShift = null;
		Vector replaceShifts = null;
		Iterator iter = null;

		StringBuffer sql1 = new StringBuffer();
		
		// Igal multi offer update
		sql1.append("( ");
		sql1.append("SELECT t.shf_employee_day_id,t.status,t.creation_date,t.err_reason,t.offer,t.modified_date, ");
		sql1.append("d.shf_employee_day_id as day_change_inx,d.modification_time,d.modification_user, d.new_employee_id ");
		sql1.append("FROM SHIFTER.SHF_REPLACE_CANDIDATES t  ");
		sql1.append("LEFT JOIN SHIFTER.shf_day_changes d ON t.shf_employee_day_id = d.shf_employee_day_id  ");
		sql1.append("WHERE (t.shf_employee_day_id = ? and t.status = ? and t.offer = ?) ");	// 1,2,3
		sql1.append(") UNION ALL ( ");
		sql1.append("SELECT * FROM (");
		sql1.append("SELECT c.shf_employee_day_id,c.status,c.creation_date,c.err_reason,c.offer,c.modified_date, ");
		sql1.append("d.shf_employee_day_id as day_change_inx,d.modification_time,d.modification_user, d.new_employee_id ");
		sql1.append("FROM SHIFTER.SHF_REPLACE_CANDIDATES c  ");
		sql1.append("LEFT JOIN SHIFTER.shf_day_changes d ON c.shf_employee_day_id = d.shf_employee_day_id  ");
		sql1.append("WHERE ( c.shf_employee_day_id = ? and c.status <> ? and c.offer IS NOT NULL ) OR (c.shf_employee_day_id=? AND c.status=? AND c.offer IS NULL)");	// 4,5,6,7
		sql1.append(")");
		sql1.append("WHERE ROWNUM = 1 ");
		sql1.append(")");
//		sql1.append("for update");
		
		// Igal multi offer update original query
//		sql1.append("SELECT t.shf_employee_day_id,t.status,t.creation_date,t.err_reason,t.offer,t.modified_date  ");
//		sql1.append(",d.shf_employee_day_id as day_change_inx,d.modification_time,d.modification_user,d.new_employee_id ");
//		sql1.append("FROM SHIFTER.SHF_REPLACE_CANDIDATES t ");
//		sql1.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id = d.shf_employee_day_id ");
//		sql1.append("WHERE (t.shf_employee_day_id=? and t.status=? and t.offer=?) ");
//		sql1.append("or (t.shf_employee_day_id=? and t.status=? and t.offer is null) ");
//		sql1.append("for update");
		
		DBAccess dBAccess = null;
		try {
			dBAccess = new DBAccess(false);
//			OfferReplaceByCritrion acceptShift = (OfferReplaceByCritrion)bf;
			fromShiftIdInt = Integer.parseInt(acceptShift.getShiftId());
			toShiftIdInt = Integer.parseInt(acceptShift.getOffer());			
			dBAccess.prepareStatement(sql1.toString());
			dBAccess.setInt(1,Integer.parseInt(acceptShift.getOffer()));	// 1
			dBAccess.setString(2,existStatus);	// 2
			dBAccess.setInt(3,Integer.parseInt(acceptShift.getShiftId()));	// 3
			dBAccess.setInt(4,Integer.parseInt(acceptShift.getShiftId()));	// 4
			dBAccess.setString(5,OPEN_REPLACE_STATUS);	// 5
			dBAccess.setInt(6,Integer.parseInt(acceptShift.getShiftId()));	// 6
			dBAccess.setString(7,OPEN_REPLACE_STATUS);	// 7
			dBAccess.executeQuery();
			replaceShifts = new Vector();					
			while (dBAccess.next())	{
				replaceShift = new ReplaceShift();
				dBAccess.populate(replaceShift);
				replaceShifts.add(replaceShift);
			}
			if (replaceShifts.size()!=2 || ((ReplaceShift)replaceShifts.get(0)).getShiftId()==0)
				throw new ShfException(" problem replace shifts");
			iter = replaceShifts.iterator();
			//HASAVA
//			AgentDayBean copmleteDayBean = new AgentDayBean();
//			copmleteDayBean = ShiftDataModel.populateShift(fromShiftIdInt);
			
			//HASAVA
			while (iter.hasNext()) {
				replaceShift = (ReplaceShift) iter.next();
				int shiftId = replaceShift.getShiftId();//dBAccess.getInt(1);
				StringBuffer sqlUpdateInsertDayChange = new StringBuffer();				 
				StringBuffer sqlDeleteFromReplaceCandidate = new StringBuffer();
				StringBuffer sqlInsertToReplaceActivities = new StringBuffer();				
				Date creation_date = replaceShift.getCreationDate();//dBAccess.getTimestamp(3);
				String err_reason = replaceShift.getErrReason();//dBAccess.getString(4);
				if (shiftId == fromShiftIdInt)	{		// acceptShift			
					if(SHFUtils.isEmpty(replaceShift.getDay_change_inx()))	{
						//HASAVA - start
						AgentDayBean agentDay =  myDay; /*ShiftDataModel.populateShift(fromShiftIdInt);*/
						AgentDayBean agentDay2 = OfferDay; /*ShiftDataModel.populateShift(Long.valueOf(acceptShift.getOffer()));*/

						int param_ind=1;
						//HASAVA - end
						
						sqlUpdateInsertDayChange.append("INSERT INTO SHIFTER.SHF_DAY_CHANGES d (d.shf_employee_day_id,d.modification_time,d.new_employee_id,d.switch_day_id, ");
						//HASAVA - start
						sqlUpdateInsertDayChange.append(" NEW_ACTIVITY ,"); //5
						sqlUpdateInsertDayChange.append(" NEW_DAY_TYPE ,"); //6
						sqlUpdateInsertDayChange.append(" NEW_EXCEPTION_TYPE_ID ,"); //7
						sqlUpdateInsertDayChange.append(" NEW_PAID_MINUTES ,"); //8
						sqlUpdateInsertDayChange.append(" NEW_SITE_ID ,"); //9
						sqlUpdateInsertDayChange.append(" NEW_TIMEOFF_TYPE_ID ,"); //10
						sqlUpdateInsertDayChange.append(" NEW_WORK_MINUTES, "); //11
						sqlUpdateInsertDayChange.append(" NEW_DAY_START, "); //12
						sqlUpdateInsertDayChange.append(" NEW_SHIFT_START, "); //13
						sqlUpdateInsertDayChange.append(" NEW_DAY_END, "); //14
						sqlUpdateInsertDayChange.append(" NEW_SHIFT_END, "); //15
						sqlUpdateInsertDayChange.append(" NEW_WORK_FROM_HOME )"); //16
						//HASAVA - end
						sqlUpdateInsertDayChange.append("values (?,?,?,?, ");
						//HASAVA - start
						sqlUpdateInsertDayChange.append(" ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )");
						//HASAVA - end
						dBAccess.prepareStatement(sqlUpdateInsertDayChange.toString());
						dBAccess.setInt(param_ind++,fromShiftIdInt); //1
						dBAccess.setTimestamp(param_ind++,new Timestamp(System.currentTimeMillis())); //2
						dBAccess.setString(param_ind++,acceptShift.getOfferEmployeeIdNum().substring(0,8)); //3
						dBAccess.setString(param_ind++,acceptShift.getOffer()); //4
						//HASAVA - start
						dBAccess.setString(param_ind++, agentDay.getShiftActivity()); //5
						dBAccess.setInt(param_ind++, agentDay.getDayType()); //6
						dBAccess.setInt(param_ind++, agentDay.getWmExceptionId()); //7
						dBAccess.setInt(param_ind++, agentDay.getPaidMinutes()); //8
						dBAccess.setString(param_ind++, agentDay2.getSiteId()); //9
						dBAccess.setInt(param_ind++, agentDay.getTimeoffTypeId()); //10
						dBAccess.setInt(param_ind++, agentDay.getWorkMinutes()); //11
						dBAccess.setTimestamp(param_ind++, agentDay.getDayStart()); //12
						dBAccess.setTimestamp(param_ind++, agentDay.getShiftStart()); //13
						dBAccess.setTimestamp(param_ind++, agentDay.getDayEnd()); //14
						dBAccess.setTimestamp(param_ind++, agentDay.getShiftEnd()); //15
						dBAccess.setString(param_ind++, agentDay2.getNewWorkFromHome() != null ? agentDay2.getNewWorkFromHome() : agentDay2.getWorkFromHome()); //16
						
						//HASAVA - end
						dBAccess.executeUpdate();
					} else	{
//						AgentDayBean agentDay2 = ShiftDataModel.populateShift(Long.valueOf(acceptShift.getOffer())); //----
						sqlUpdateInsertDayChange.append("UPDATE SHIFTER.SHF_DAY_CHANGES d SET d.modification_time = ?, d.new_employee_id = ?,d.switch_day_id=?, d.NEW_SITE_ID=?, d.NEW_WORK_FROM_HOME=? ");
						sqlUpdateInsertDayChange.append("where d.shf_employee_day_id = ? ");
						dBAccess.prepareStatement(sqlUpdateInsertDayChange.toString());						
						dBAccess.setTimestamp(1,new Timestamp(System.currentTimeMillis()));
						dBAccess.setString(2,acceptShift.getOfferEmployeeIdNum().substring(0,8));
						dBAccess.setString(3,acceptShift.getOffer());
						dBAccess.setString(4,OfferDay.getSiteId());
						dBAccess.setString(5,OfferDay.getNewWorkFromHome() != null ? OfferDay.getNewWorkFromHome() : OfferDay.getWorkFromHome());
						dBAccess.setString(6,acceptShift.getShiftId());
						dBAccess.executeUpdate();						
					}

					sqlDeleteFromReplaceCandidate.append("DELETE FROM SHIFTER.SHF_REPLACE_CANDIDATES t ");
					sqlDeleteFromReplaceCandidate.append("where (t.shf_employee_day_id = ? and t.status <> ? and t.offer is not null) ");	// 1,2
					sqlDeleteFromReplaceCandidate.append("or (t.shf_employee_day_id = ? and t.status = ? and t.offer is null)");	// 3,4
					dBAccess.prepareStatement(sqlDeleteFromReplaceCandidate.toString());
					dBAccess.setInt(1,fromShiftIdInt);	// 1
					dBAccess.setString(2,OPEN_REPLACE_STATUS);	// 2
					dBAccess.setInt(3,fromShiftIdInt);	// 3
					dBAccess.setString(4,OPEN_REPLACE_STATUS);	// 4
					dBAccess.executeUpdate();
					
					sqlInsertToReplaceActivities.append("INSERT INTO SHIFTER.shf_replace_activities t (t.shf_employee_day_id,t.cration_date,t.status,t.err_reason,t.modified_date,t.offer) ");
					sqlInsertToReplaceActivities.append("values (?,?,?,?,?,?) ");
					dBAccess.prepareStatement(sqlInsertToReplaceActivities.toString());
					dBAccess.setInt(1,fromShiftIdInt);
					dBAccess.setTimestamp(2,creation_date);
					dBAccess.setString(3,CLOSE_REPLACE);										
					dBAccess.setString(4,SHFUtils.replaceNullWithEmptyString(err_reason));
					dBAccess.setTimestamp(5,new Timestamp(System.currentTimeMillis()));
					dBAccess.setInt(6,toShiftIdInt);										
					dBAccess.executeUpdate();					
				} else if (shiftId==toShiftIdInt)	{
					if(SHFUtils.isEmpty(replaceShift.getDay_change_inx()))	{
						//HASAVA - start
//						AgentDayBean agentDay = ShiftDataModel.populateShift(toShiftIdInt);	// offer
//						AgentDayBean agentDay2 = ShiftDataModel.populateShift(Long.valueOf(acceptShift.getShiftId()));	// accept
						int param_ind=1;
						//HASAVA - end
						sqlUpdateInsertDayChange.append("INSERT INTO SHIFTER.SHF_DAY_CHANGES d (d.shf_employee_day_id,d.modification_time,d.new_employee_id,d.switch_day_id, ");
						//HASAVA - start
						sqlUpdateInsertDayChange.append(" NEW_ACTIVITY ,"); //5
						sqlUpdateInsertDayChange.append(" NEW_DAY_TYPE ,"); //6
						sqlUpdateInsertDayChange.append(" NEW_EXCEPTION_TYPE_ID ,"); //7
						sqlUpdateInsertDayChange.append(" NEW_PAID_MINUTES ,"); //8
						sqlUpdateInsertDayChange.append(" NEW_SITE_ID ,"); //9
						sqlUpdateInsertDayChange.append(" NEW_TIMEOFF_TYPE_ID ,"); //10
						sqlUpdateInsertDayChange.append(" NEW_WORK_MINUTES, "); //11
						sqlUpdateInsertDayChange.append(" NEW_DAY_START, "); //12
						sqlUpdateInsertDayChange.append(" NEW_SHIFT_START, "); //13
						sqlUpdateInsertDayChange.append(" NEW_DAY_END, "); //14
						sqlUpdateInsertDayChange.append(" NEW_SHIFT_END, "); //15
						sqlUpdateInsertDayChange.append(" NEW_WORK_FROM_HOME )"); //16
						//HASAVA - end
						sqlUpdateInsertDayChange.append("values (?,?,?,?, ");
						//HASAVA - start
						sqlUpdateInsertDayChange.append(" ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )");
						//HASAVA - end
						dBAccess.prepareStatement(sqlUpdateInsertDayChange.toString());
						dBAccess.setInt(param_ind++,toShiftIdInt); //1
						dBAccess.setTimestamp(param_ind++,new Timestamp(System.currentTimeMillis())); //2
						//dBAccess.setString(3,acceptShift.getUserId());																	
						dBAccess.setString(param_ind++,acceptShift.getEmployeePersonalId().substring(0,8)); //3
						dBAccess.setString(param_ind++,acceptShift.getShiftId()); //4
						//HASAVA - start
						dBAccess.setString(param_ind++, OfferDay.getShiftActivity()); //5
						dBAccess.setInt(param_ind++, OfferDay.getDayType()); //6
						dBAccess.setInt(param_ind++, OfferDay.getWmExceptionId()); //7
						dBAccess.setInt(param_ind++, OfferDay.getPaidMinutes()); //8
						dBAccess.setString(param_ind++, myDay.getSiteId()); //9
						dBAccess.setInt(param_ind++, OfferDay.getTimeoffTypeId()); //10
						dBAccess.setInt(param_ind++, OfferDay.getWorkMinutes()); //11
						dBAccess.setTimestamp(param_ind++, OfferDay.getDayStart()); //12
						dBAccess.setTimestamp(param_ind++, OfferDay.getShiftStart()); //13
						dBAccess.setTimestamp(param_ind++, OfferDay.getDayEnd()); //14
						dBAccess.setTimestamp(param_ind++, OfferDay.getShiftEnd()); //15
						dBAccess.setString(param_ind++, myDay.getNewWorkFromHome() != null ? myDay.getNewWorkFromHome() : myDay.getWorkFromHome()); //16
						//HASAVA - end
						dBAccess.executeUpdate();
					} else	{
//						AgentDayBean agentDay2 = ShiftDataModel.populateShift(Long.valueOf(acceptShift.getShiftId()));
						sqlUpdateInsertDayChange.append("UPDATE SHIFTER.SHF_DAY_CHANGES d SET d.modification_time = ?, d.new_employee_id = ?, d.switch_day_id=?, d.NEW_SITE_ID=?, d.NEW_WORK_FROM_HOME=? ");
						sqlUpdateInsertDayChange.append("where d.shf_employee_day_id = ? ");
						dBAccess.prepareStatement(sqlUpdateInsertDayChange.toString());						
						dBAccess.setTimestamp(1,new Timestamp(System.currentTimeMillis()));
						dBAccess.setString(2,acceptShift.getEmployeePersonalId().substring(0,8));
						dBAccess.setString(3,acceptShift.getShiftId());
						dBAccess.setString(4,myDay.getSiteId());
						dBAccess.setString(5,myDay.getNewWorkFromHome() != null ? myDay.getNewWorkFromHome() : myDay.getWorkFromHome());
						dBAccess.setString(6,acceptShift.getOffer());
						dBAccess.executeUpdate();						
					}

					sqlDeleteFromReplaceCandidate.append("DELETE FROM SHIFTER.SHF_REPLACE_CANDIDATES t ");
					sqlDeleteFromReplaceCandidate.append("where t.shf_employee_day_id = ? and t.status = ? "); //  and t.offer = ? 
					dBAccess.prepareStatement(sqlDeleteFromReplaceCandidate.toString());
					dBAccess.setInt(1,toShiftIdInt);
					dBAccess.setString(2,WAIT_FOR_ANS_STATUS);
//					dBAccess.setInt(3,fromShiftIdInt);					
					dBAccess.executeUpdate();
					
					sqlInsertToReplaceActivities.append("INSERT INTO SHIFTER.shf_replace_activities t (t.shf_employee_day_id,t.cration_date,t.status,t.err_reason,t.modified_date,t.offer) ");
					sqlInsertToReplaceActivities.append("values (?,?,?,?,?,?) ");
					dBAccess.prepareStatement(sqlInsertToReplaceActivities.toString());
					dBAccess.setInt(1,toShiftIdInt);
					dBAccess.setTimestamp(2,creation_date);
					dBAccess.setString(3,CLOSE_REPLACE);										
					dBAccess.setString(4,SHFUtils.replaceNullWithEmptyString(err_reason));										
					dBAccess.setTimestamp(5,new Timestamp(System.currentTimeMillis()));
					dBAccess.setInt(6,fromShiftIdInt);										
					dBAccess.executeUpdate();					
				}
				
			}
//			dBAccess.commit();	// Managed breaks, commit only if breaks were successfully synchronized with SoftPhone
			isAcceptReplaceOffer = true;
														
		} catch(DBQueryNoRowsException e){
			try {
				dBAccess.rollback();
				logger.error("error on ReplaceByCritrionDao acceptReplaceOffer cant replace shift" + e.getMessage());
				throw new ShfException("error on ReplaceByCritrionDao acceptReplaceOffer cant replace shift", e);	
			} catch (DBException e1) {
				throw new ShfException("db.close()", e1);
			}						
		} catch (DBException e) {
			try {
				dBAccess.rollback();
				logger.error("error on ReplaceByCritrionDao rejectReplaceOffer " + e.getMessage());
				throw new ShfException("error on ReplaceByCritrionDao rejectReplaceOffer", e);
			} catch (DBException e1) {
				throw new ShfException("db.close()", e1);
			}
		} finally{
//			try {	// Managed breaks, commit only if breaks were successfully synchronized with SoftPhone
//				dBAccess.close();
//			} catch (DBException e) {
//				throw new ShfException("Error while db.close()", e);
//			}
		}
		
		// 8.2016 Managed breaks (after switch shift, send new breaks to SoftPhone, if failed abort switch)
		
		boolean AcceptIsManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(acceptShift.getEmployeeOrgUnit())).getValue());
//		boolean AcceptIsPilotAgent = SHFConstants.managedBreaksEmpList.contains(acceptShift.getEmployeePersonalId());
		
		boolean OfferIsManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(acceptShift.getOfferOrgUnitID())).getValue());
//		boolean OfferIsPilotAgent = SHFConstants.managedBreaksEmpList.contains(acceptShift.getOfferEmployeeIdNum());
		
		boolean isManagedBreaks = AcceptIsManagedBreaks || OfferIsManagedBreaks;
//		boolean isPilotAgent = AcceptIsPilotAgent || OfferIsPilotAgent; 
		
		if (isManagedBreaks /*&& isPilotAgent*/) {
			
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			SHFSPBreaks breakObject = of.createSHFSPBreaks();
			List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
			
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(acceptShift.getUserId());
			
			// Get breaks for both agents in order to switch between them at SoftPhone side
			Vector<BreakBean> acceptBreaks = null;
			Vector<BreakBean> offerBreaks = null;
//			if (AcceptIsManagedBreaks && AcceptIsPilotAgent) {
//				acceptBreaks = BreakDataModel.populateBreaksForShift(Long.valueOf(acceptShift.getShiftId()));
//			}
//			if (OfferIsManagedBreaks && OfferIsPilotAgent) {
//				offerBreaks = BreakDataModel.populateBreaksForShift(Long.valueOf(acceptShift.getOffer()));
//			}
			if ((AcceptIsManagedBreaks /*&& AcceptIsPilotAgent*/) || (OfferIsManagedBreaks /*&& OfferIsPilotAgent*/)) {	// if either of agents has auto breaks then bring both break data for switch
				acceptBreaks = BreakDataModel.populateBreaksForShift(Long.valueOf(acceptShift.getShiftId()));
				offerBreaks = BreakDataModel.populateBreaksForShift(Long.valueOf(acceptShift.getOffer()));
			}
			
			
			if ( (AcceptIsManagedBreaks /*&& AcceptIsPilotAgent*/) && (acceptBreaks != null && acceptBreaks.size() > 0)) {		// delete current breaks (and later insert offer's breaks if exist)
				
				for(BreakBean breakBean : acceptBreaks){
					BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
					breakInfoIns.setMode("D");
					breakInfoIns.setEmployeeId(myDay.getEmployeeIdNumberFull());
					breakInfoIns.setAgentDayId(Long.valueOf(acceptShift.getShiftId()));
					breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
					breakInfoIns.setDuration(breakBean.getDuration());
					
					breakInfoList.add(breakInfoIns);
				}
				
				if ( offerBreaks != null && offerBreaks.size() > 0) {	// insert offer's breaks instead (switch)
					
					for(BreakBean breakBean : offerBreaks){
						BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
						breakInfoIns.setMode("I");
						breakInfoIns.setEmployeeId(myDay.getEmployeeIdNumberFull());
						breakInfoIns.setAgentDayId(Long.valueOf(acceptShift.getOffer()));
						breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
						breakInfoIns.setDuration(breakBean.getDuration());
						
						breakInfoList.add(breakInfoIns);
					}
				}
			}
			
			if ( (OfferIsManagedBreaks /*&& OfferIsPilotAgent*/) && (offerBreaks != null && offerBreaks.size() > 0)) {
				
				for(BreakBean breakBean : offerBreaks){	// delete offer's breaks
					BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
					breakInfoIns.setMode("D");
					breakInfoIns.setEmployeeId(OfferDay.getEmployeeIdNumberFull());
					breakInfoIns.setAgentDayId(Long.valueOf(acceptShift.getOffer()));
					breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
					breakInfoIns.setDuration(breakBean.getDuration());
					
					breakInfoList.add(breakInfoIns);
				}
				
				if ( acceptBreaks != null && acceptBreaks.size() > 0) {

					for(BreakBean breakBean : acceptBreaks) {	// insert accept's breaks instead (switch)
						BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
						breakInfoIns.setMode("I");
						breakInfoIns.setEmployeeId(OfferDay.getEmployeeIdNumberFull());
						breakInfoIns.setAgentDayId(Long.valueOf(acceptShift.getShiftId()));
						breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
						breakInfoIns.setDuration(breakBean.getDuration());
						
						breakInfoList.add(breakInfoIns);
					}
				}
			}
			
			
			if (breakObject.getBreakInfo().size() > 0) {	// changes exist -> send message to SoftPhone
				
				// convert to xml string (initial)
				String xmlStringMsg = null;
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				BreakDataModel breakModel = new BreakDataModel();
				
				// insert to transactions table and get transaction ID
				TransactionBean transBean = breakModel.getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_SWITCH_SHIFT, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, acceptShift.getUserId(), xmlStringMsg);
				
				breakModel.createMessageTransaction(transBean);
				
				breakObject.setTransactionId(String.valueOf(transBean.getId()));
				
				// convert to xml string (final)
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					logger.info("xmlString : "+xmlStringMsg);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// send Tibco message
				if (xmlStringMsg != null && transBean.getId() != 0) {
					try {
						logger.info("Attempting to send message to tibco queue ...");
						breakModel.sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
					} catch (XPathExpressionException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IllegalArgumentException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (NamingException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (JMSException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					
					//check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
					logger.info("Checking response for transactiod id : " + transBean.getId());
					
					Vector<Long> tmpVec = new Vector<Long>();
					tmpVec.add(transBean.getId());
					Vector<TransactionBean> response = null;
					boolean success = false;
					
					try {
						response = breakModel.checkMessageResponse(tmpVec);
						
						if(response.size() > 0) {
							TransactionBean respBean = response.get(0);
							logger.info("Response message found in DB");
							if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
								success = true;
								logger.info("Message contains SUCCESS status !");
							}
						}
						
					} catch (Exception e) {
						
					}
					if ( ! success) {
						
						// Failed to update SoftPhone, revert changes
						logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
						
						try {
							logger.info("Attempting DB rollback ... ");
							dBAccess.rollback();
						} catch (DBException e) {
							logger.error("Error while rollback : " + e.getMessage());
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
							throw new ShfException(actionErrors);
						} finally {
							try {
								dBAccess.close();
							} catch (DBException e) {
								logger.error("Error while closing db connection: "+e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							}
						}
						logger.info("Changes reverted successfully !");
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
						throw new ShfException(actionErrors);
						
					} else {
						logger.info("Sync with SoftPhone complete, all changes applied successfully");
					}
				}
			}
		}	// END IF isManagedBreaks
		
		try {
			dBAccess.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}

		return isAcceptReplaceOffer;
	}

	public Vector selectRangeShifts(Date startTime, String shiftId, String empIdNum) throws ShfException {
		Vector rangeShifts = null;
		logger.debug("ReplaceByCritrionDao: selectRangeShifts.");

		ReplaceByCritrion replaceByCritrion=null;
		
		StringBuffer sql=new StringBuffer();		
		sql.append("select t.shf_employee_day_id,nvl(d.new_shift_start,t.wm_shift_start_datetime) as starttime,nvl(d.new_shift_end,t.wm_shift_end_datetime) as endtime ");
		sql.append("from SHIFTER.shf_employee_day t ");
		sql.append("left join SHIFTER.shf_day_changes d on t.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on nvl(d.new_employee_id,t.emp_id_number)=substr(e.emp_id_number,1,8) ");
		sql.append("where substr(e.emp_id_number,1,8)=?  ");
		sql.append("and t.shf_employee_day_id<>? ");
		sql.append("and nvl(d.new_shift_start,t.wm_shift_start_datetime) between ?-1 and ?+1 ");
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,empIdNum.substring(0,8));
			dBAccess.setString(2,shiftId);
			dBAccess.setDate(3,startTime);
			dBAccess.setDate(4,startTime);
			dBAccess.executeQuery();
			rangeShifts=new Vector();
			
			while(dBAccess.next()){						
				replaceByCritrion = new ReplaceByCritrion();										
				dBAccess.populate(replaceByCritrion);
				rangeShifts.add(replaceByCritrion);
			}			
		}  catch(DBQueryNoRowsException e){			
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao selectRangeShifts " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao selectRangeShifts", e);
		} finally{
			try {
				dBAccess.close();				
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}		
		return rangeShifts;
	}

	public boolean isExistInRepository(String shiftId) throws ShfException	{
		logger.debug("ReplaceByCritrionDao: isExistInRepository");

		StringBuffer sql=new StringBuffer();
		boolean isExistInRepository = false;
		sql.append("SELECT t.shf_employee_day_id FROM SHIFTER.SHF_REPLACE_CANDIDATES t WHERE t.shf_employee_day_id=?");

		DBAccess dBAccess=null;				
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,shiftId);	
			dBAccess.executeQuery();				
			if (dBAccess.next())	{				
				isExistInRepository = true;
			}								
		}  catch(DBQueryNoRowsException e){						
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao isExistInRepository " + e.getMessage());
			throw new ShfException("error on ReplaceByCritrionDao isExistInRepository", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return isExistInRepository; 		
	}
	
	public Vector<ReplaceCandidates> getFromReplaceCandidatesByShiftId ( Vector<Integer> shiftIds ) throws ShfException {
		logger.debug("getFromReplaceCandidatesByShiftId()");

		Vector<ReplaceCandidates> result = null;
		if ( shiftIds == null || shiftIds.size() < 1 ) return result;

		StringBuffer sql = new StringBuffer();
		sql.append("SELECT * FROM SHIFTER.SHF_REPLACE_CANDIDATES c ");
		sql.append("WHERE c.shf_employee_day_id in ( ");
		Iterator<Integer> iter = shiftIds.iterator();
			while ( iter.hasNext() ) {
				sql.append(iter.next());
				if ( iter.hasNext() ) {
					sql.append(",");
				}
			}
		sql.append(" ) ");

			
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.executeQuery();
			result = new Vector<ReplaceCandidates>();
			dBAccess.populate("bzq.shf.transfer.ReplaceCandidates", result);
		}  catch(DBQueryNoRowsException e){	
			
		} catch (DBException e) {
			logger.error("error on getFromReplaceCandidatesByShiftId()  " + e.getMessage());
			throw new ShfException("error on getFromReplaceCandidatesByShiftId() ", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("getFromReplaceCandidatesByShiftId() while db.close()", e);
			}
		}
		
		
	return result;
	}
	
	
}

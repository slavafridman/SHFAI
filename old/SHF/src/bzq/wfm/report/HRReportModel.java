package bzq.wfm.report;

import java.util.ArrayList;

import org.apache.log4j.Logger;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;

public class HRReportModel {

	private static Logger logger=Logger.getLogger(HRReportModel.class);
	
	public static ArrayList<HRData> getHRData(WfmReportForm reportForm){
		ArrayList<HRData> list=new ArrayList<HRData>();
		
		String agaf=reportForm.getAgaf();
		String moked=reportForm.getMoked();
		String[] team=reportForm.getTeam();
		String[] innerJob=reportForm.getInnerJob();
		String[] activityList=reportForm.getActivityList();
		String[] skillList=reportForm.getSkillList();
		
		String job=reportForm.getJob();
		int status=reportForm.getStatus();
		
		StringBuffer str=new StringBuffer();
		str.append("select suv.AgafName,suv.MokedName,suv.TzevetName,se.emp_id_number, ");
		str.append("se.first_name||' '||se.last_name as emp_name,se.status_id,se.job_name, ");
		str.append("si.inner_job_name,se.job_time,se.moked_start_date ");
		str.append("from shifter.shf_employees se ");
		str.append("left join shifter.shf_org_units_view suv on se.org_unit_id=suv.TzevetId ");
		str.append("left join shifter.shf_inner_jobs si on si.inner_job_id=se.inner_job_id WHERE 1=1 ");
		if(agaf!=null && agaf.length()>0 && !agaf.equals("-1")){
			str.append("AND suv.AGAFID=? ");
		}
		if(moked!=null && moked.length()>0 && !moked.equals("-1")){
			str.append("AND suv.MOKEDID=? ");
		}
		if(job!=null && job.length()>0 && !job.equals("-1") && !job.equals("00")){
			str.append("AND se.JOB_ID=? ");
		}
		if(status>0){
			str.append("AND se.status_id=? ");
		}
		
		if(team!=null && team.length>0 && !team[0].equals("00")){
			str.append("AND suv.TZEVETID in ( ");
			for(int i=0;i<team.length;i++){
				str.append(team[i]);
				if(i<team.length-1){
					str.append(",");
				}
			}
			str.append(")");
		}
		
		if(innerJob!=null && innerJob.length>0 && !innerJob[0].equals("00")){
			str.append("AND se.inner_job_id in ( ");
			for(int i=0;i<innerJob.length;i++){
				str.append(innerJob[i]);
				if(i<innerJob.length-1){
					str.append(",");
				}
			}
			str.append(")");
		}
		
		str.append(" order by suv.AgafId,suv.MokedId,suv.TzevetId,se.first_name,se.last_name ");
		
		int param=1;
		DBAccess db=null;
		DBAccess wfmdb=null;
		try{
			db=new DBAccess();
			wfmdb=new DBAccess("wfm");
			
			db.prepareStatement(str.toString());
			if(agaf!=null && agaf.length()>0 && !agaf.equals("-1")){
				db.setString(param++,agaf);
			}
			if(moked!=null && moked.length()>0 && !moked.equals("-1")){
				db.setString(param++,moked);
			}
			if(job!=null && job.length()>0 && !job.equals("-1") && !job.equals("00")){
				db.setString(param++,job);
			}
			if(status>0){
				db.setInt(param++, status);
			}
			db.executeQuery();
			HRData data=null;
			
			while(db.next()){
				data=new HRData();
				data.setAgaf(db.getString(1));
				data.setMoked(db.getString(2));
				data.setTeam(db.getString(3));
				data.setIdnum(db.getString(4));
				data.setEmpName(db.getString(5));
				data.setSapStatus(db.getString(6));
				data.setSapJob(db.getString(7));
				data.setInnerJob(db.getString(8));
				data.setSapJobTime(db.getString(9));
				if(db.getString(10)!=null){
					data.setSapStartDate(db.getTimestamp(10));
				}
				getWFMData(wfmdb,data,reportForm);
				list.add(data);
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try{
					db.close();
				}catch (Exception e) {
					logger.error(e);
				}
			}
			
			if(wfmdb!=null){
				try{
					wfmdb.close();
				}catch (Exception e) {
					logger.error(e);
				}
			}
		}
		
		return list;
	}
	
	
	
	public static void getWFMData(DBAccess db,HRData empHrData, WfmReportForm reportForm){
		String[] activityList=reportForm.getActivityList();
		String[] skillList=reportForm.getSkillList();
		
		String idnum=empHrData.getIdnum().substring(0, 8);
		
		if(activityList==null || activityList.length==0 || "00".equals(activityList[0])){
			empHrData.activitiesFlag=new int[0];
		}else{
			empHrData.activitiesFlag=new int[activityList.length];
			
		}
		
		if(skillList==null || skillList.length==0 || "00".equals(skillList[0])){
			empHrData.skillsFlag=new String[0];
		}else{
			empHrData.skillsFlag=new String[skillList.length];
			
		}
		
		StringBuilder activityCheck=new StringBuilder();
		activityCheck.append("select count(*) from (select t.gsw_skill_id from wm_activity_skills t where t.wm_activity_id=? minus( ");
		activityCheck.append("select a.gsw_skill_id from wm_agent_skills a left join wm_agents g on g.gsw_agent_id=a.gsw_agent_id ");
		activityCheck.append("where substr(g.gsw_employee_id,1,8)=? group by a.gsw_skill_id)) ");

		
		StringBuilder strWmData=new StringBuilder();
		strWmData.append("select distinct c.wm_name contract_name,t.wm_start_date,t.wm_end_date,c.wm_weekly_minutes_min,c.wm_weekly_minutes_max ");
		for(int i=0;i<empHrData.activitiesFlag.length;i++){
			strWmData.append(",("+activityCheck.toString()+") ");
		}
		for(int i=0;i<empHrData.skillsFlag.length;i++){
			strWmData.append(",(select distinct s.GSW_SKILL_LEVEL from wm_agent_skills s left join wm_agents g on g.gsw_agent_id=s.gsw_agent_id where substr(g.gsw_employee_id,1,8)=? and s.gsw_skill_id=?) ");
		}
		strWmData.append("from wm_agents t left join wm_contracts c on c.wm_contract_id=t.wm_contract_id ");
		strWmData.append("where substr(t.gsw_employee_id,1,8)=? ");
		
		int param=1;
		try{
			db.prepareStatement(strWmData.toString());
			for(int i=0;i<empHrData.activitiesFlag.length;i++){
				db.setString(param++, activityList[i]);
				db.setString(param++, idnum);
			}
			for(int i=0;i<empHrData.skillsFlag.length;i++){
				db.setString(param++, idnum);
				db.setString(param++, skillList[i]);
			}
			db.setString(param++, idnum);
			db.executeQuery();
			
			while(db.next()){
				empHrData.setContractName(db.getString(1));
				if(db.getString(2)!=null){
					empHrData.setWfmStartDate(db.getTimestamp(2));
				}
				if(db.getString(3)!=null){
					empHrData.setWfmTerminationDate(db.getTimestamp(3));
				}
				empHrData.setWeekMinMinutes(db.getInt(4));
				empHrData.setWeekMaxMinutes(db.getInt(5));
				
				for(int i=0;i<empHrData.activitiesFlag.length;i++){
					empHrData.activitiesFlag[i]=db.getInt(6+i);
				}
				for(int i=0;i<empHrData.skillsFlag.length;i++){
					empHrData.skillsFlag[i]=db.getString(empHrData.activitiesFlag.length+6+i);
				}
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error(e);
		}
		/*
		try{
			db.prepareStatement(strSkills.toString());
			db.setString(1, empHrData.getIdnum());
			db.executeQuery();
			ArrayList<String> skills=new ArrayList<String>();
			while(db.next()){
				skills.add(db.getString(1));
			}
			empHrData.setSkills(skills);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error(e);
		}
		
		try{
			db.prepareStatement(strActivities.toString());
			db.setString(1, empHrData.getIdnum());
			db.executeQuery();
			ArrayList<String> activities=new ArrayList<String>();
			while(db.next()){
				activities.add(db.getString(1));
			}
			empHrData.setActivities(activities);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error(e);
		}
			*/
		
	}
	
	
	
}

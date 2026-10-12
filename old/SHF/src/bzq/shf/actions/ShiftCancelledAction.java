package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.forms.ActivityCancelForm;
import bzq.shf.model.ShiftCancelledModel;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;

public class ShiftCancelledAction extends BaseAction{
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		ShiftCancelledModel shiftCancelledModel = null ;
		ActivityCancelForm activityCancelForm = null;
		
		
//		---
		try {	
			if(param.equals("param")){
										
				activityCancelForm=(ActivityCancelForm)form;
				
				ActivityCancelForm storedAttendanceForm = (ActivityCancelForm)request.getSession().getAttribute("activityCancelForm");
				if(storedAttendanceForm==null){
					shiftCancelledModel=new ShiftCancelledModel(activityCancelForm);
					shiftCancelledModel.setCurrentDefaults();
				}else{
					activityCancelForm.copyForm(storedAttendanceForm);
				}
				result=mapping.findForward("success");	
			}
			else if(param.equals("result")){
				activityCancelForm=(ActivityCancelForm)form;
				request.getSession().setAttribute("activityCancelForm",activityCancelForm);
				shiftCancelledModel=new ShiftCancelledModel(activityCancelForm);
				Vector vec=shiftCancelledModel.populateCancelled();
				request.setAttribute("shift_cancelled_list",vec);
				result=mapping.findForward("success");	
			}
		
			else if(param.equals("export")){
				activityCancelForm=(ActivityCancelForm)form;
				shiftCancelledModel=new ShiftCancelledModel(activityCancelForm);
				Vector vec=shiftCancelledModel.populateCancelled();
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=shifts_cancelled_table.xls");
				logger.info("exporting shifts_cancelled to excell");
				
				PrintWriter out = response.getWriter();
				if(vec!=null){
					AgentDayBean day=null;
					out.print("יום"+"\t");
					out.print("תאריך"+"\t");
					out.print("שם"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("תור"+"\t");
					out.print("צוות"+"\t");
					out.print("סוג פעילות"+"\t");
					out.print("החלפה"+"\t");
					out.print("תיגבור"+"\t");
					out.print("שינוי"+"\t");
					out.print("מבטל"+"\t");
					out.print("זמן ביטול"+"\t");
					out.print("סיבת ביטול"+"\t");
					out.print("הערות"+"\t");
					out.print("\n");
					
					
					for(int i=0;i<vec.size();i++){
						day=(AgentDayBean)vec.get(i);
						logger.info("start populating cancelled shifts to excell");
						out.print(SHFUtils.getDayOfWeek(day.getShiftStart()));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"dd/MM/yyyy"));
						out.print("\t");
						out.print(day.getFullName());
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"HH:mm"));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftEnd(),"HH:mm"));
						out.print("\t");
						out.print(SHFTableUtils.getInnerJobName(day.getInnerJobId()));
						out.print("\t");
						out.print(SHFTableUtils.getActivityNamesExport(day.getShiftActivity()));
						out.print("\t");
						out.print(SHFTableUtils.getUnitName(day.getOrgUnitCode()));
						out.print("\t");
						out.print(SHFTableUtils.getExceptionName(String.valueOf(day.getExceptionTypeId())));
						out.print("\t");
						out.print((day.getSwitchDayId()>0 ?"כן":"לא"));
						out.print("\t");
						out.print((day.getShiftSource().startsWith("f")?"כן":"לא"));
						out.print("\t");
						if(day.getNewShiftStart()!=null || day.getNewShiftEnd()!=null)
							out.print(SHFUtils.getLengthFormat(day.getShiftLengthChange()));
						else
							out.print("לא");
						out.print("\t");
						out.print((day.getModificationUser()!=null ?day.getModificationUser():""));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getModificationTime(),"HH:mm"));
						out.print("\t");
						out.print((day.getCancelReasonCode()!=null?SHFTableUtils.getReasonDesc(Integer.parseInt(day.getCancelReasonCode())):"" ) );
						out.print("\t");
						out.print((day.getCancelReasonRemark()==null?"":day.getCancelReasonRemark()));
						out.print("\t");
						
						
						out.print("\n");
					}
					
				}
				out.close();
			}
			
			
			
		}	
		catch(ShfException e){
			
				
			}
			
		return result;

	}	
}
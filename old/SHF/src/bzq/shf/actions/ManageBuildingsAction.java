package bzq.shf.actions;

import java.io.IOException;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.forms.BuildingForm;
import bzq.shf.forms.TeamForm;
import bzq.shf.model.BuildingModel;
import bzq.shf.utils.ShfException;

public class ManageBuildingsAction extends BaseAction{
	
	private Logger logger=Logger.getLogger(ManageBuildingsAction.class);
	
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		
		response.setHeader("Cache-Control","no-cache");
		response.setHeader("Pragma","no-cache"); 
		response.setContentType("text/html;charset=WINDOWS-1255"); 
		
		logger.debug("manage buildings");
		
		if(param.equals("manage_buildings")){
			BuildingForm buildingForm=(BuildingForm)form;
			BuildingModel buildingModel=new BuildingModel();
			buildingModel.setBuildingForm(buildingForm);
			String action=buildingForm.getAction();
			try{
				if("view".equals(action)){
					result=mapping.findForward("successView");
					logger.debug("view buildings");
					ArrayList<BuildingForm> list=buildingModel.getAllBuildings();
					request.setAttribute("buildings", list);
					
				}else if("add".equals(action)){
					result=mapping.findForward("successUpdate");
					buildingModel.addBuilding();
					
				}else if("update".equals(action)){
					result=mapping.findForward("successUpdate");
					buildingModel.updateBuilding();
					
				}else if("delete".equals(action)){
					result=mapping.findForward("successUpdate");
					buildingModel.deleteBuilding();
					
				}else if("view_update".equals(action)){
					result=mapping.findForward("successViewUpdate");
					BuildingForm building=buildingModel.populateBuilding();
					request.setAttribute("building", building);
					
				}
			}catch (ShfException e) {
				logger.error(e);
				saveErrors(request,e.getErrors());
			}
		}else if("view_teams".equals(param)){
			BuildingForm buildingForm=(BuildingForm)form;
			BuildingModel buildingModel=new BuildingModel();
			buildingModel.setBuildingForm(buildingForm);
			try{
				String moked=buildingForm.getOrgUnit();
				ArrayList<TeamForm> teams=buildingModel.getTeamsBuildings();
				request.setAttribute("teams", teams);
				request.setAttribute("moked", moked);
				result=mapping.findForward("success");
			}catch (ShfException e) {
				logger.error(e);
				saveErrors(request,e.getErrors());
			}
		}
		else if("update_team_building".equals(param)){
			TeamForm teamForm=(TeamForm)form;
			BuildingModel buildingModel=new BuildingModel();
			try{
				buildingModel.updateTeamBuilding(teamForm);
				result=mapping.findForward("success");
			}catch (ShfException e) {
				result=mapping.findForward("fail");
				logger.error(e);
				saveErrors(request,e.getErrors());
			}
		}

		return result;
	}
}
